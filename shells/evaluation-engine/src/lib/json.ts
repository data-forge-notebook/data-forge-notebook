//
// Utils for working with json.
//

//
// Stringify JSON data, even if it contains circular refs.
// https://stackoverflow.com/a/11616993/25868
//
export function stringify(data: any): string {    
    let cache: Set<any> | undefined = new Set<any>();

    const json = JSON.stringify(data, (key: string, value: any) => {
        if (typeof(value) === 'object' && value) {
            if (cache!.has(value)) {
                // Duplicate reference found, discard key.
                return;
            }

            cache!.add(value);
        }
        return value;
    });

    cache = undefined; // Enable garbage collection
    return json;
}

