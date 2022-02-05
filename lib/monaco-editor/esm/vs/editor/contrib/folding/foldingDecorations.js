/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ModelDecorationOptions } from '../../common/model/textModel.js';
import { Codicon, registerIcon } from '../../../base/common/codicons.js';
export const foldingExpandedIcon = registerIcon('folding-expanded', Codicon.chevronDown);
export const foldingCollapsedIcon = registerIcon('folding-collapsed', Codicon.chevronRight);
export class FoldingDecorationProvider {
    constructor(editor) {
        this.editor = editor;
        this.autoHideFoldingControls = true;
        this.showFoldingHighlights = true;
    }
    getDecorationOption(isCollapsed, isHidden) {
        if (isHidden) {
            return FoldingDecorationProvider.HIDDEN_RANGE_DECORATION;
        }
        if (isCollapsed) {
            return this.showFoldingHighlights ? FoldingDecorationProvider.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION : FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION;
        }
        else if (this.autoHideFoldingControls) {
            return FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION;
        }
        else {
            return FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION;
        }
    }
    deltaDecorations(oldDecorations, newDecorations) {
        return this.editor.deltaDecorations(oldDecorations, newDecorations);
    }
    changeDecorations(callback) {
        return this.editor.changeDecorations(callback);
    }
}
FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION = ModelDecorationOptions.register({
    stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
    afterContentClassName: 'inline-folded',
    isWholeLine: true,
    firstLineDecorationClassName: foldingCollapsedIcon.classNames
});
FoldingDecorationProvider.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION = ModelDecorationOptions.register({
    stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
    afterContentClassName: 'inline-folded',
    className: 'folded-background',
    isWholeLine: true,
    firstLineDecorationClassName: foldingCollapsedIcon.classNames
});
FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION = ModelDecorationOptions.register({
    stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
    isWholeLine: true,
    firstLineDecorationClassName: foldingExpandedIcon.classNames
});
FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION = ModelDecorationOptions.register({
    stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
    isWholeLine: true,
    firstLineDecorationClassName: 'alwaysShowFoldIcons ' + foldingExpandedIcon.classNames
});
FoldingDecorationProvider.HIDDEN_RANGE_DECORATION = ModelDecorationOptions.register({
    stickiness: 1 /* NeverGrowsWhenTypingAtEdges */
});
