
export function deepCompare (obj1: any, obj2: any) {
    const j1 = JSON.stringify(obj1);
    const j2 = JSON.stringify(obj2);
    return j1 === j2;
}