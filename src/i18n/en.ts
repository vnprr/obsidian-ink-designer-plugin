const en: Record<string, string> = {
	// Player
	"player.title": "Ink Player",
	"player.restart": "Restart",
	"player.end": "--- End ---",

	// Menu
	"menu.playFromHere": "Play Ink from here",
	"menu.playFromStart": "Play Ink story",

	// Commands
	"cmd.playStory": "Ink Designer: Play Ink story",
	"cmd.newKnot": "Ink Designer: New narrative node",
	"cmd.newCharacter": "Ink Designer: New character",
	"cmd.newGlobals": "Ink Designer: New _globals",

	// Settings
	"settings.heading": "Ink Designer settings",
	"settings.choiceMode.name": "Choice syntax mode",
	"settings.choiceMode.desc": "How choices are written in Markdown. Blockquote uses '> - text', asterisk uses '* text'.",
	"settings.storyFolder.name": "Story folder",
	"settings.storyFolder.desc": "Folder containing your Ink story notes.",
	"settings.showDecorations.name": "Show Ink decorations",
	"settings.showDecorations.desc": "Display visual indicators for choices, diverts, and ink expressions in reading view.",
	"settings.defaultProject.name": "Default project",
	"settings.defaultProject.desc": "Default ink-project value for new notes. Leave empty to include all notes.",

	// Errors
	"error.compile": "Ink compile error: {message}",
	"error.noGlobals": "No _globals note found. Create a note with ink-type: _globals.",
	"error.noStart": "Set ink-start in your _globals note first.",
	"error.compileFailed": "Ink compilation failed.",

	// Decorations
	"decoration.choice": "Choice",
	"decoration.stickyChoice": "Sticky choice",
	"decoration.divert": "Divert",
	"decoration.inkExpr": "Ink expression",
	"decoration.condition": "Condition",
	"decoration.sequence": "Sequence",

	// Variable suggest
	"suggest.global": "Global variable",
	"suggest.fromGlobals": "from _globals",
	"suggest.fromObject": "from {source}",
};

export default en;
