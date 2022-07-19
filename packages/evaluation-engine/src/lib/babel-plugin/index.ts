//
// Babel plugin to inject variables into the __capture_locals function.
//

import { NodePath } from "babel-traverse";
import { objectProperty, identifier, CallExpression, Identifier, VariableDeclarator, expressionStatement, callExpression, isExpressionStatement, isCallExpression, isIdentifier, isMemberExpression, isVariableDeclaration } from "babel-types";

export function customPlugin(babel: any) {
    return {
        visitor: {
            CallExpression: {
                enter(path: NodePath<CallExpression>) {
                    const callee = path.node.callee as Identifier;
                    if (callee.name === "__capture_locals") { // Find the __capture_locals call.
                        path.skip(); // Stop traversal.
        
                        let variables: string[] = [];

                        const parentKey = path.parentPath.key as number;

                        // if (parentKey > 0) {
                        //     // Get the latest statement and display it .
                        //     const lastStatement = path.parentPath.getSibling(parentKey-1);
                        //     if (isExpressionStatement(lastStatement.node)) {
                        //         let isDisplayCell = false;
                        //         if (isCallExpression(lastStatement.node.expression)) {
                        //             if (isIdentifier(lastStatement.node.expression.callee) 
                        //                 && lastStatement.node.expression.callee.name === "display") {
                        //                 isDisplayCell = true;
                        //             }
                        //             else if (isMemberExpression(lastStatement.node.expression.callee)
                        //                 && isIdentifier(lastStatement.node.expression.callee.object) 
                        //                 && lastStatement.node.expression.callee.object.name === "display") {
                        //                 isDisplayCell = true;
                        //             }
                        //             else if (isMemberExpression(lastStatement.node.expression.callee)
                        //                 && isIdentifier(lastStatement.node.expression.callee.object) 
                        //                 && lastStatement.node.expression.callee.object.name === "console") {
                        //                 isDisplayCell = true;
                        //             }
                        //         }
    
                        //         if (!isDisplayCell) {
                        //             const autoDisplayStmt = expressionStatement(
                        //                 callExpression(
                        //                     identifier("__auto_display"),
                        //                     [
                        //                         lastStatement.node.expression,
                        //                     ]
                        //                 )
                        //             );
                        //             lastStatement.replaceWith(autoDisplayStmt);
                        //         }
                        //     }
                        // }
            
                        for (let key = 0; key < parentKey; key += 1) { // Collect variable decls.
                            const sibling = path.parentPath.getSibling(key);
                            if (isVariableDeclaration(sibling.node)) {
                                for (const declaration of sibling.node.declarations) {
                                    if (isIdentifier(declaration.id)) {
                                        variables.push(declaration.id.name);
                                    }
                                }
                            }
                        }
    
                        path.traverse({ // Find the object expression and inject variables.
                            ObjectExpression(path) {
                                path.skip(); // Stop traversal.

                                const objectExpression = path.node;
                                for (const variable of variables) {
                                    objectExpression.properties.push(objectProperty(
                                        identifier(variable),
                                        identifier(variable),
                                    ));
    
                                    // objectExpression.properties.push({
                                    //     "type": "ObjectProperty",       
                                    //     "method": false,                
                                    //     "shorthand": false,             
                                    //     "computed": false,              
                                    //     "key": {                        
                                    //         "type": "Identifier",       
                                    //         "name": variable, //.id.name,
                                    //     },                              
                                    //     "value": {                      
                                    //         "type": "Identifier",       
                                    //         "name": variable, //.id.name,
                                    //     }
                                    // });
                                }            
                            }
                        });
                    }
                }
            },
        }
    };
}