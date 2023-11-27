//
// This code is inspired by unpkg.com.
//

import * as fs from "fs-extra";
import * as url from 'url';
import * as http from 'http';
import * as https from 'https';
import * as tar from 'tar-stream';
import gunzip from 'gunzip-maybe';
import * as path from "path";
import * as semver from 'semver';
import stream, { Readable } from "stream";

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';

//
// Downloads a package to the requested path.
//
export async function downloadPackage(packageName: string, packageVersion: string, projectPath: string): Promise<boolean> {
    const modulePath = path.join(projectPath, "node_modules", packageName);
    if (await fs.pathExists(modulePath)) {
        // Already downloaded.
        console.log(`Package ${packageName} already downloaded.`);
        return false;
    }

    const resolvedVersion = await resolveVersion(packageName, packageVersion);
    if (resolvedVersion === null) {
        return false;
    }
    
    const stream = await getPackage(packageName, resolvedVersion);
    if (stream === null) {
        return false;
    }
    
    await fs.ensureDir(modulePath);
    await saveFiles(stream, modulePath);
    return true;
}

const agent = new https.Agent({
    keepAlive: true
});

function encodePackageName(packageName: string): string  {
    return isScopedPackageName(packageName)
        ? `@${encodeURIComponent(packageName.substring(1))}`
        : encodeURIComponent(packageName);
}

async function fetchPackageInfo(packageName: string): Promise<any> {
    const name = encodePackageName(packageName);
    const infoURL = `${NPM_REGISTRY_URL}/${name}`;

    console.log('Fetching package info for %s from %s', packageName, infoURL);

    const { hostname, pathname } = url.parse(infoURL);
    const options = {
        agent: agent,
        hostname: hostname,
        path: pathname,
        headers: {
            Accept: 'application/json'
        }
    };

    const res = await get(options);

    if (res.statusCode === 200) {
        const json = (await bufferStream(res)).toString("utf-8");
        return JSON.parse(json);
    }

    if (res.statusCode === 404) {
        return null;
    }

    const content = await bufferStream(res);

    console.error(
        'Error fetching info for %s (status: %s)',
        packageName,
        res.statusCode
    );
    console.error(content);

    return null;
}

async function fetchVersionsAndTags(packageName: string): Promise<any> {
    const info = await fetchPackageInfo(packageName);
    return info && info.versions
        ? { versions: Object.keys(info.versions), tags: info['dist-tags'] }
        : null;
}

/**
 * Returns an object of available { versions, tags }.
 * Uses a cache to avoid over-fetching from the registry.
 */
async function getVersionsAndTags(packageName: string): Promise<any> {
    const value = await fetchVersionsAndTags(packageName);

    if (value == null) {
        return null;
    }

    return value;
}

async function resolveVersion(packageName: string, range: string): Promise<string | null> {
    const versionsAndTags = await getVersionsAndTags(packageName);

    if (versionsAndTags) {
        const { versions, tags } = versionsAndTags;

        if (range in tags) {
            range = tags[range];
        }

        return versions.includes(range)
            ? range
            : semver.maxSatisfying<string>(versions, range);
    }

    return null;
}

function get(options: https.RequestOptions): Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
        https.get(options, resolve).on('error', reject);
    });
}

function isScopedPackageName(packageName: string): boolean {
    return packageName.startsWith('@');
}

/**
 * Returns a stream of the tarball'd contents of the given package.
 */
async function getPackage(packageName: string, version: string): Promise<Readable | null> {

    const tarballName = isScopedPackageName(packageName)
        ? packageName.split('/')[1]
        : packageName;
    const tarballURL = `${NPM_REGISTRY_URL}/${packageName}/-/${tarballName}-${version}.tgz`;

    console.log('Fetching package for %s from %s', packageName, tarballURL);

    const { hostname, pathname } = url.parse(tarballURL);
    const options = {
        agent: agent,
        hostname: hostname,
        path: pathname
    };

    const res = await get(options);

    if (res.statusCode === 200) {
        const stream = res.pipe(gunzip());
        return stream;
    }

    if (res.statusCode === 404) {
        return null;
    }

    const content = await bufferStream(res);

    console.error(
        'Error fetching tarball for %s@%s (status: %s)',
        packageName,
        version,
        res.statusCode
    );
    console.error(content);

    return null;
}

//
// Save all files from the stream.
//
async function saveFiles(stream: Readable, modulePath: string): Promise<void> {

    return new Promise((resolve, reject) => {

        stream
            .pipe(tar.extract())
            .on('error', reject)
            .on('entry', async (header, stream, next) => {

                const entry = {
                    // Most packages have header names that look like `package/index.js`
                    // so we shorten that to just `/index.js` here. A few packages use a
                    // prefix other than `package/`. e.g. the firebase package uses the
                    // `firebase_npm/` prefix. So we just strip the first dir name.
                    path: header.name.replace(/^[^/]+\/?/, '/'),
                    type: header.type
                };

                console.log(entry);

                // Ignore non-files and files that don't match the name.
                if (entry.type !== 'file') {
                    stream.resume();
                    stream.on('end', next);
                    return;
                }

                try {
                    await fs.ensureDir(`${modulePath}/${path.dirname(entry.path)}`);

                    stream.pipe(fs.createWriteStream(`${modulePath}/${entry.path}`))
                        .on('error', reject)
                        .on('finish', next);
                } 
                catch (error) {
                    next(error);
                }
            })
            .on('finish', () => {
                resolve();
            });
    });
}

function bufferStream(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];

        stream
            .on('error', reject)
            .on('data', (chunk: any) => chunks.push(chunk))
            .on('end', () => resolve(Buffer.concat(chunks)));
    });
}
