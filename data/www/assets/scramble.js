// scramble text
class TextScramble {
    constructor(el) {
        this.el = el
        this.chars = '!<>-_\\/[]{}—=+*^?#________'
        this.update = this.update.bind(this)
    }
    setText(newText) {
        const oldText = this.el.innerText
        const length = Math.max(oldText.length, newText.length)
        const promise = new Promise((resolve) => this.resolve = resolve)
        this.queue = []
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || ''
            const to = newText[i] || ''
            const start = Math.floor(Math.random() * 40)
            const end = start + Math.floor(Math.random() * 40)
            this.queue.push({ from, to, start, end })
        }
        cancelAnimationFrame(this.frameRequest)
        this.frame = 0
        this.update()
        return promise
    }
    update() {
        let output = []
        let complete = 0
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i]
            if (this.frame >= end) {
                complete++
                output.push({ text: to, isDud: false })
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar()
                    this.queue[i].char = char
                }
                output.push({ text: char, isDud: true })
            } else {
                output.push({ text: from, isDud: false })
            }
        }
        this.el.textContent = ''
        output.forEach(item => {
            if (item.isDud) {
                const span = document.createElement('span')
                span.className = 'dud'
                span.textContent = item.text
                this.el.appendChild(span)
            } else {
                this.el.appendChild(document.createTextNode(item.text))
            }
        })
        if (complete === this.queue.length) {
            this.resolve()
        } else {
            this.frameRequest = requestAnimationFrame(this.update)
            this.frame++
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)]
    }
}

// execute and write
const host = window.location.hostname
const phrases = [
    'hello, friend!',
    'welcome to the void...',
    '   '
]
phrases.push(host)

const el = document.querySelector('.text')
const fx = new TextScramble(el)

let counter = 0
const next = () => {
    fx.setText(phrases[counter]).then(() => {
        counter = counter + 1
        if (counter < phrases.length) {
            setTimeout(next, 800)
        } else {
            // Wait 2 seconds after showing hostname, then transition to terminal
            setTimeout(() => {
                transitionToTerminal()
            }, 2000)
        }
    })
}

function transitionToTerminal() {
    const container = document.querySelector('.container')
    const textEl = document.querySelector('.text')

    // Scramble to empty to make hostname disappear
    fx.setText('').then(() => {
        // Hide the intro text and switch to terminal mode
        textEl.style.display = 'none'
        container.classList.add('terminal-mode')

        // Show terminal and scramble in the prompt
        const terminal = document.getElementById('terminal')
        terminal.classList.add('active')

        // Create a temporary element for scrambling the prompt
        const promptScramble = document.createElement('div')
        promptScramble.className = 'terminal-line'
        promptScramble.style.color = '#4CAF50'
        const output = document.getElementById('terminal-output')
        output.appendChild(promptScramble)

        const promptFx = new TextScramble(promptScramble)
        promptFx.setText('> _').then(() => {
            // Remove the scrambled prompt line after animation
            setTimeout(() => {
                promptScramble.remove()
                document.getElementById('terminal-input').focus()
            }, 500)
        })
    })
}

next()  
