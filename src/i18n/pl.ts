const pl: Record<string, string> = {
	// Player
	"player.title": "Odtwarzacz Ink",
	"player.restart": "Od nowa",
	"player.end": "--- Koniec ---",

	// Menu
	"menu.playFromHere": "Odtwórz Ink stąd",
	"menu.playFromStart": "Odtwórz historię Ink",

	// Commands
	"cmd.playStory": "Ink Designer: Odtwórz historię Ink",
	"cmd.newKnot": "Ink Designer: Nowy węzeł narracyjny",
	"cmd.newCharacter": "Ink Designer: Nowa postać",
	"cmd.newGlobals": "Ink Designer: Nowy _globals",

	// Settings
	"settings.heading": "Ustawienia Ink Designer",
	"settings.choiceMode.name": "Tryb składni wyborów",
	"settings.choiceMode.desc": "Jak wybory są zapisywane w Markdown. Blockquote używa '> - tekst', asterisk używa '* tekst'.",
	"settings.storyFolder.name": "Folder historii",
	"settings.storyFolder.desc": "Folder z notatkami historii Ink.",
	"settings.showDecorations.name": "Pokaż dekoracje Ink",
	"settings.showDecorations.desc": "Wyświetlaj wizualne wskaźniki wyborów, odnośników i wyrażeń ink w widoku czytania.",
	"settings.defaultProject.name": "Domyślny projekt",
	"settings.defaultProject.desc": "Domyślna wartość ink-project dla nowych notatek. Puste = uwzględnij wszystkie.",

	// Errors
	"error.compile": "Błąd kompilacji Ink: {message}",
	"error.noGlobals": "Nie znaleziono notatki _globals. Utwórz notatkę z ink-type: _globals.",
	"error.noStart": "Ustaw ink-start w notatce _globals.",
	"error.compileFailed": "Kompilacja Ink nie powiodła się.",

	// Decorations
	"decoration.choice": "Wybór",
	"decoration.stickyChoice": "Wybór sticky",
	"decoration.divert": "Przejście",
	"decoration.inkExpr": "Wyrażenie Ink",
	"decoration.condition": "Warunek",
	"decoration.sequence": "Sekwencja",

	// Variable suggest
	"suggest.global": "Zmienna globalna",
	"suggest.fromGlobals": "z _globals",
	"suggest.fromObject": "z {source}",
};

export default pl;
