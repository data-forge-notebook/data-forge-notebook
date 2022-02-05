declare var document: any;

export function loadMonaco() {
    console.log(`Loading monaco!`)
    return new Promise<void>((resolve, reject) => {
        var script = document.createElement('script');
        script.onload = () => {
            const amdRequire = window.require as any;
        amdRequire.config({
            baseUrl: "lib/monaco-editor/min",
        });

        // workaround monaco-css not understanding the environment
        (self as any).module = undefined;
    
        amdRequire(
            ['vs/editor/editor.main'], 
            () => {
                    console.log(`Monaco was loaded!`);
                resolve();
            },
            (err: any) => {
                reject(err);
            }
        );
        };

        script.setAttribute('src', './node_modules/requirejs/require.js');
        document.head.appendChild(script);
    });
}