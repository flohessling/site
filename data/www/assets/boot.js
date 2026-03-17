// Boot sequence
const normalBootSequence = [
    { text: 'loading kernel modules...', delay: 30, class: 'boot' },
    { text: '[  OK  ] started journal service', delay: 25, class: 'success' },
    { text: '[  OK  ] started network time synchronization', delay: 20, class: 'success' },
    { text: '[  OK  ] reached target network', delay: 25, class: 'success' },
    { text: '[  OK  ] started user manager', delay: 20, class: 'success' },
    { text: '[  OK  ] reached target multi-user', delay: 30, class: 'success' },
    { text: 'checking web freedom status...', delay: 40, class: 'boot' },
    { text: '[FAILED] open web not found', delay: 100, class: 'error' },
    { text: '[FAILED] corporate enclosure detected', delay: 80, class: 'error' },
    { text: '[FAILED] freedom check failed', delay: 120, class: 'error' },
    { text: '', delay: 200 },
    { text: 'falling back to init1...', delay: 300, class: 'boot' },
    { text: '', delay: 200 }
]

const bootSequence = [
    { text: `host: ${window.location.hostname}`, delay: 200, class: 'boot' },
    { text: 'init 1', delay: 200, class: 'boot' },
    { text: '', delay: 100 },
    { text: 'entering single-user mode...', delay: 150, class: 'boot' },
    { text: '[  OK  ] started emergency shell', delay: 120, class: 'success' },
    { text: '[  OK  ] reached target rescue mode', delay: 100, class: 'success' },
    { text: '', delay: 300 },
    { text: 'hello, friend!', delay: 400, class: 'greeting' },
    { text: `welcome to the void...`, delay: 600, class: 'greeting' },
    { text: '', delay: 200 },
    { text: 'type "help" to see available commands', delay: 400, class: 'boot' },
    { text: '', delay: 400 }
]

function addLine(text, className = '') {
    const output = document.getElementById('terminal-output')
    const line = document.createElement('div')
    line.className = `terminal-line ${className}`
    line.textContent = text
    output.appendChild(line)

    // Scroll to bottom
    const terminal = document.getElementById('terminal')
    terminal.scrollTop = terminal.scrollHeight
}

function typewriterLine(text, className = '', charDelay = 40) {
    return new Promise(resolve => {
        const output = document.getElementById('terminal-output')
        const terminal = document.getElementById('terminal')
        const line = document.createElement('div')
        line.className = `terminal-line ${className}`
        output.appendChild(line)

        let i = 0
        function typeNext() {
            if (i < text.length) {
                line.textContent += text[i++]
                terminal.scrollTop = terminal.scrollHeight
                setTimeout(typeNext, charDelay)
            } else {
                resolve()
            }
        }
        typeNext()
    })
}

function clearTerminal() {
    const output = document.getElementById('terminal-output')
    output.innerHTML = ''
}

async function runBootSequence() {
    // Run fast "normal" boot that crashes
    for (const item of normalBootSequence) {
        await new Promise(resolve => setTimeout(resolve, item.delay))
        addLine(item.text, item.class)
    }

    // Hold crashed state for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Clear screen before init 1
    clearTerminal()

    // Run init 1 recovery sequence
    for (const item of bootSequence) {
        await new Promise(resolve => setTimeout(resolve, item.delay))
        if (item.class === 'greeting' && item.text) {
            await typewriterLine(item.text, item.class)
        } else {
            addLine(item.text, item.class)
        }
    }

    // Show input line after boot sequence
    const inputLine = document.getElementById('terminal-input-line')
    inputLine.classList.remove('hidden')
    document.getElementById('terminal-input').focus()
}

// Start boot sequence when page loads
window.addEventListener('load', () => {
    // Add TV power-on animation class
    document.body.classList.add('tv-on')

    // Start boot sequence after animation completes
    setTimeout(() => {
        // Mark animation as complete to keep terminal visible
        document.body.classList.add('animation-complete')
        runBootSequence()
    }, 600)
})
