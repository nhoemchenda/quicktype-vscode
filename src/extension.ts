"use strict";

import * as vscode from "vscode";
import { Range } from "vscode";
import { paste as pasteCallback } from "copy-paste";
import { quicktype, languageNamed, SerializedRenderResult } from "quicktype";

async function paste(): Promise<string> {
    return new Promise<string>((pass, fail) => {
        pasteCallback((err, content) => err ? fail(err) : pass(content));
    });
}

function jsonIsValid(json: string) {
    try {
        JSON.parse(json);
    } catch (e) {
        return false;
    }
    return true;
}

async function promptTopLevelName(): Promise<{ cancelled: boolean, name: string }> {
    let topLevelName = await vscode.window.showInputBox({
        prompt: "What is the top-level type name for this JSON?"
    });

    return {
        cancelled: topLevelName === undefined,
        name: topLevelName || "TopLevel"
    };
}

async function pasteJSONAsCode(editor: vscode.TextEditor, justTypes: boolean) {
    const documentLanguage = editor.document.languageId;
    const maybeLanguage = languageNamed(documentLanguage);
    const language = maybeLanguage === undefined ? "types" : documentLanguage;

    const content = await paste();
    if (!jsonIsValid(content)) {
        vscode.window.showErrorMessage("Clipboard does not contain valid JSON.");
        return;
    }

    const rendererOptions = {};
    if (justTypes) {
        rendererOptions["just-types"] = "true";
        rendererOptions["features"] = "just-types";
    }

    const topLevelName = await promptTopLevelName();
    if (topLevelName.cancelled) {
        return;
    }

    let result: SerializedRenderResult;
    try {
        result = await quicktype({
            lang: language,
            sources: [{name: topLevelName.name, samples: [content]}],
            rendererOptions
        });
    } catch (e) {
        // TODO Invalid JSON produces an uncatchable exception from quicktype
        // Fix this so we can catch and show an error message.
        vscode.window.showErrorMessage(e);
        return;
    }
    
    const text = result.lines.join("\n");
    const selection = editor.selection;
    editor.edit(builder => {
        if (selection.isEmpty) {
            builder.insert(selection.start, text);
        } else {
            builder.replace(new Range(selection.start, selection.end), text);
        }    
    });
}

export function activate(context: vscode.ExtensionContext) {
    const pasteAsCode = vscode.commands.registerTextEditorCommand(
        "extension.pasteJSONAsCode",
        editor => pasteJSONAsCode(editor, true)
    );
    const pasteForSerialization = vscode.commands.registerTextEditorCommand(
        "extension.pasteJSONForSerialization",
        editor => pasteJSONAsCode(editor, false)
    );

    context.subscriptions.push(pasteAsCode, pasteForSerialization);
}

export function deactivate(): void {
    return;
}
