/**
 * Async function to update a components state without overwriting existing state.
 * 
 * @param overrides Values to set in the new state.
 */

export async function updateState<PropsT, StateT>(component: React.Component<PropsT, StateT>, overrides: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        component.setState(overrides, () => resolve());
    });
}
