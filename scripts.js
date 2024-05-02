var triggerPhraseMap = {
    'note-mel': 'Měl bych',
    'note-musi': 'Musím',
    'note-mela': 'Měla bych',
    'note-musime': 'Musíme',
    'note-melibysme': 'Měli bysme',
    'note-melibychom': 'Měli bychom',
    'custom-trigger': 'Custom' // Default phrase for custom triggers
};

const listeningStatus = document.getElementById('listeningStatus');
const status = document.getElementById('status');document.addEventListener('DOMContentLoaded', function() {
    if (!window.notesLoaded) {
        loadNotes();
        setupVoiceRecognition();
        window.notesLoaded = true;
        var currentDateSpan = document.getElementById('currentDate');
    var today = new Date();
    var dateString = today.toLocaleDateString('cs-CZ', {
        year: 'numeric', month: 'numeric', day: 'numeric'
    });
    currentDateSpan.textContent = dateString;
    }
});

function setupVoiceRecognition() {
    if (annyang) {
        annyang.setLanguage('cs-CZ');
        annyang.addCommands(setupCommands());
        annyang.addCallback('soundstart', () => updateStatus('Listening...', 'orange'));
        annyang.addCallback('resultMatch', (userSaid, commandText) => updateStatus(`Command recognized: ${commandText}`, 'green'));
        annyang.addCallback('resultNoMatch', (phrases) => updateStatus('No command recognized', 'red'));
        annyang.start({ autoRestart: true, continuous: true });
    } else {
        alert('Annyang is not loaded!');
    }
}

function setupCommands() {
    var commands = {};
    Object.keys(triggerPhraseMap).forEach(key => {
        commands[`${triggerPhraseMap[key]} *note`] = (note) => addNote(note, key);
    });
    return commands;
}

function addNote(note, noteClass) {
    const noteArea = document.getElementById('noteArea');
    const datetime = new Date().toLocaleString('cs-CZ', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    let noteElement = document.createElement('div');
    noteElement.className = 'single ' + noteClass;
    noteElement.setAttribute('data-datetime', datetime);

    let textSpan = document.createElement('span');  // Use a span to hold the text content
    textSpan.textContent = `${triggerPhraseMap[noteClass] || 'Custom Note'} ${note}`;
    noteElement.appendChild(textSpan);

    noteElement.appendChild(createDeleteButton(noteElement));
    noteElement.onclick = () => makeNoteEditable(noteElement);
    noteArea.prepend(noteElement);
    saveNotes();
}



function createDeleteButton(noteElement) {
    if (!noteElement) {
        console.error("createDeleteButton was called without a noteElement");
        return null; // Early exit if no element is provided
    }

    let deleteButton = noteElement.querySelector('.delete');
    if (!deleteButton) {
        deleteButton = document.createElement('button');
        deleteButton.textContent = '';
        deleteButton.className = 'delete';
        deleteButton.style.display = 'none';
        deleteButton.onclick = function(event) {
            event.stopPropagation();
            noteElement.remove();
            saveNotes();
        };
    }
    return deleteButton;
}


function makeNoteEditable(noteElement) {
    noteElement.contentEditable = true;
    noteElement.focus();
    noteElement.onblur = function() {
        noteElement.contentEditable = false;
        saveNotes();
    };
}

function updateStatus(message, color) {
    const status = document.getElementById('status');
    const listeningStatus = document.getElementById('listeningStatus');
    status.textContent = message;
    listeningStatus.style.color = color;
    setTimeout(() => {
        status.textContent = 'Ready';
        listeningStatus.style.color = 'blue';
    }, 3000);
}

function saveNotes() {
    const notes = Array.from(document.querySelectorAll('.single')).map(note => {
        let textSpan = note.querySelector('span'); // Ensure only text content is saved
        return {
            datetime: note.getAttribute('data-datetime'),
            text: textSpan.textContent, // Save only the text content
            noteClass: note.className.split(' ')[1]
        };
    });
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotes() {
    const notesArea = document.getElementById('noteArea');
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    savedNotes.forEach(({ text, noteClass, datetime }) => {
        let noteElement = document.createElement('div');
        noteElement.className = 'single ' + noteClass;
        noteElement.setAttribute('data-datetime', datetime);

        let textSpan = document.createElement('span');
        textSpan.textContent = text;
        noteElement.appendChild(textSpan);

        noteElement.appendChild(createDeleteButton(noteElement));
        noteElement.onclick = () => makeNoteEditable(noteElement);
        notesArea.prepend(noteElement);
    });
}
function downloadNotes() {
    var notes = document.querySelectorAll('.single');
    var content = 'Your Notes:\n';
    notes.forEach(function(note) {
        var datetime = note.getAttribute('data-datetime');
        var text = note.querySelector('span').textContent; // Assuming text is within a <span>
        content += `${datetime} - ${text}\n`;
    });
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function addNewTrigger() {
    var newTriggerPhrase = prompt("Please enter your new voice trigger:");
    if (newTriggerPhrase && annyang) {
        // Define the action for the new trigger
        var command = {};
        command[newTriggerPhrase + ' *note'] = function (note) {
            // Ensure we're passing the correct trigger class to addNote
            addNote(note, 'note-' + newTriggerPhrase);
        };

        // Add the new command to annyang
        annyang.addCommands(command);

        // Update the triggerPhraseMap with the new trigger
        triggerPhraseMap['note-' + newTriggerPhrase] = newTriggerPhrase;

        // Update UI list of triggers if necessary
        updateTriggerList(newTriggerPhrase);
    }
}


function updateTriggerList(triggerPhrase) {
    var triggerContainer = document.getElementById('voiceTriggers');
    var innerContainer = triggerContainer.querySelector('.inline-flex');
    if (innerContainer) {
        var newTriggerDiv = document.createElement('div');
        newTriggerDiv.textContent = triggerPhrase;
        newTriggerDiv.className = 'note-' + triggerPhrase;
        innerContainer.appendChild(newTriggerDiv);
    }
}
function addManualNote() {
    var noteInput = document.getElementById('manualNoteInput');
    if (noteInput.value.trim() !== '') {
        addNote('noteArea', noteInput.value, 'manual-note');
        noteInput.value = ''; // Clear input after adding
    }
}

