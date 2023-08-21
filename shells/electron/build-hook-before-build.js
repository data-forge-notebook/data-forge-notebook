exports.default = async function (context) {
    // Stops any shenangians with node_modules.
    // Gotta wish Electron-builder could document this stuff.
    return false;
}
