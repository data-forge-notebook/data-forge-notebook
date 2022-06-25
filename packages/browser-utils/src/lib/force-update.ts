/**
 * Async function to for a component to rerender.
 */

export function forceUpdate<PropsT, StateT>(component: React.Component<PropsT, StateT>): Promise<void> {
    return new Promise((resolve, reject) => {
        component.forceUpdate(() => {
            resolve();    
        })
    });
}
