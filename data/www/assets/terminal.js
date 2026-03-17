// Virtual filesystem
const FS = {
    '/dev/null/void': {
        type: 'dir',
        children: {
            'projects': {
                type: 'dir',
                children: {
                    'banking-saas': {
                        type: 'file',
                        html: true,
                        content: [
                            '<span style="color:#888">project:   </span>banking-saas',
                            '<span style="color:#888">industry:  </span>financial services',
                            '',
                            'built a saas platform for a german banking data center.',
                            '<span style="color:#888">core tech: </span>application virtualization via citrix xenapp',
                            '           and microsoft app-v.',
                            '',
                            'turned legacy desktop software into centrally managed,',
                            'streamed applications — no local install required.',
                        ]
                    },
                    'shopware-saas': {
                        type: 'file',
                        html: true,
                        content: [
                            '<span style="color:#888">project:   </span>shopware-saas',
                            '<span style="color:#888">industry:  </span>ecommerce',
                            '',
                            'built the entire cloud infrastructure from scratch for',
                            "shopware's saas ecommerce offering on aws.",
                            '',
                            '<span style="color:#888">team:      </span>5 engineers (including me)',
                            '<span style="color:#888">scope:     </span>multi-tenant platform, zero to production',
                            '<span style="color:#888">stack:     </span>aws — ecs, rds, elasticache, s3, cloudfront,',
                            '           route53, iam, and more.',
                            '',
                            'the kind of project where you learn what "boring',
                            'infrastructure" really means.',
                        ]
                    }
                }
            },
            'repos': {
                type: 'file',
                content: [
                    'my dotfiles:    https://github.com/flohessling/.dotfiles',
                ]
            },
            '.fsociety00.dat': {
                type: 'file',
                hidden: true,
                content: [
                    '-----------------------------------',
                    'there is nothing here.',
                    'there is everything here.',
                    ' ',
                    '746869732069732074686520766F69642E',
                    '-----------------------------------',
                ]
            }
        }
    }
}

function fsResolve(cwd, inputPath) {
    // Resolve an input path relative to cwd, returning absolute path string or null
    let parts
    if (inputPath.startsWith('/')) {
        parts = inputPath.split('/').filter(Boolean)
    } else {
        parts = [...cwd.split('/').filter(Boolean), ...inputPath.split('/').filter(Boolean)]
    }

    const resolved = []
    for (const part of parts) {
        if (part === '.') continue
        if (part === '..') { resolved.pop(); continue }
        resolved.push(part)
    }

    return '/' + resolved.join('/')
}

function fsGet(path) {
    // Walk FS tree and return node or null
    const parts = path.split('/').filter(Boolean)
    let node = FS['/dev/null/void']

    // The root of our fs is /dev/null/void — handle that prefix
    const root = ['dev', 'null', 'void']
    for (let i = 0; i < root.length; i++) {
        if (parts[i] !== root[i]) return null
    }

    const rest = parts.slice(root.length)
    for (const part of rest) {
        if (!node || node.type !== 'dir') return null
        node = node.children[part]
        if (!node) return null
    }
    return node
}

// Terminal command handler
class Terminal {
    constructor() {
        this.cwd = '/dev/null/void'
        this.commands = {
            about: this.about.bind(this),
            help: this.help.bind(this),
            clear: this.clear.bind(this),
            pwd: this.pwd.bind(this),
            ls: this.ls.bind(this),
            cd: this.cd.bind(this),
            cat: this.cat.bind(this),
            exit: this.exit.bind(this)
        }
        this.history = []
        this.historyIndex = -1
        this.setupEventListeners()
    }

    setupEventListeners() {
        const input = document.getElementById('terminal-input')
        this.tabMatches = []
        this.tabIndex = -1

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                this.tabMatches = []
                this.tabIndex = -1
                this.handleCommand(input.value)
                input.value = ''
                input.classList.remove('valid-command')
            } else if (e.key === 'Tab') {
                e.preventDefault()
                this.handleTab(input)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                this.tabMatches = []
                this.tabIndex = -1
                this.navigateHistory(-1)
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                this.tabMatches = []
                this.tabIndex = -1
                this.navigateHistory(1)
            } else {
                // Any other key resets tab cycling
                this.tabMatches = []
                this.tabIndex = -1
            }
        })

        input.addEventListener('input', () => {
            const commandName = input.value.trim().split(' ')[0].toLowerCase()
            input.classList.toggle('valid-command', !!this.commands[commandName])
        })
    }

    handleTab(input) {
        const value = input.value
        const tokens = value.split(' ')
        const isFirstToken = tokens.length === 1

        if (isFirstToken) {
            // Complete command name
            const partial = tokens[0].toLowerCase()
            if (this.tabMatches.length === 0) {
                this.tabMatches = Object.keys(this.commands).filter(c => c.startsWith(partial))
                this.tabIndex = -1
            }
            if (this.tabMatches.length === 0) return
            this.tabIndex = (this.tabIndex + 1) % this.tabMatches.length
            input.value = this.tabMatches[this.tabIndex]
        } else {
            // Complete path argument (last token)
            const cmd = tokens[0]
            const partial = tokens[tokens.length - 1]
            const prefix = tokens.slice(0, -1).join(' ') + ' '

            if (this.tabMatches.length === 0) {
                this.tabMatches = this.getPathCompletions(partial)
                this.tabIndex = -1
            }
            if (this.tabMatches.length === 0) return
            this.tabIndex = (this.tabIndex + 1) % this.tabMatches.length
            input.value = prefix + this.tabMatches[this.tabIndex]
        }

        // Keep cursor at end and update valid-command highlight
        const commandName = input.value.trim().split(' ')[0].toLowerCase()
        input.classList.toggle('valid-command', !!this.commands[commandName])
    }

    getPathCompletions(partial) {
        // Split into dir portion and name prefix
        const lastSlash = partial.lastIndexOf('/')
        const dirPart = lastSlash >= 0 ? partial.slice(0, lastSlash + 1) : ''
        const namePart = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial

        const dirPath = dirPart ? fsResolve(this.cwd, dirPart) : this.cwd
        const node = fsGet(dirPath)
        if (!node || node.type !== 'dir') return []

        return Object.entries(node.children)
            .filter(([name, child]) => !child.hidden && name.startsWith(namePart))
            .map(([name, child]) => dirPart + name + (child.type === 'dir' ? '/' : ''))
    }

    handleCommand(cmd) {
        const trimmed = cmd.trim()

        // Add to history
        if (trimmed) {
            this.history.push(trimmed)
            this.historyIndex = this.history.length
        }

        // Echo command
        this.addOutput(`> ${cmd}`)

        // Execute command
        if (trimmed === '') {
            return
        }

        const commandName = trimmed.split(' ')[0].toLowerCase()

        if (this.commands[commandName]) {
            this.commands[commandName](trimmed)
        } else {
            this.addOutput(`command not found: ${commandName}`)
        }
    }

    navigateHistory(direction) {
        const input = document.getElementById('terminal-input')
        this.historyIndex += direction

        if (this.historyIndex < 0) {
            this.historyIndex = 0
        } else if (this.historyIndex >= this.history.length) {
            this.historyIndex = this.history.length
            input.value = ''
            return
        }

        input.value = this.history[this.historyIndex] || ''
    }

    addOutput(text, allowHTML = false, type = null) {
        const output = document.getElementById('terminal-output')
        const line = document.createElement('div')
        line.className = 'terminal-line'

        if (type === 'error') {
            line.style.color = '#f2474c'
        }

        if (allowHTML) {
            line.innerHTML = text
        } else {
            line.textContent = text
        }

        output.appendChild(line)

        // Scroll to bottom
        const terminal = document.getElementById('terminal')
        terminal.scrollTop = terminal.scrollHeight
    }

    about() {
        const kv = (key, value) =>
            `<span style="color:#888">${key}</span>${value}`
        this.addOutput('')
        this.addOutput(kv('name:        ', 'flo hessling'), true)
        this.addOutput(kv('location:    ', 'münsterland, germany'), true)
        this.addOutput(kv('profession:  ', 'cloud engineer, making infrastructure boring (on purpose)'), true)
        this.addOutput(kv('github:      ', '<a href="https://github.com/flohessling" target="_blank" rel="noopener noreferrer">github.com/flohessling</a>'), true)
        this.addOutput('')
    }

    help() {
        const cmd = (left, right) =>
            `<span style="color:#06d092">${left}</span><span style="color:#888">${right}</span>`
        this.addOutput('')
        this.addOutput('available commands:')
        this.addOutput(cmd('  about     ', ' - display information about me'), true)
        this.addOutput(cmd('  ls [-a]   ', ' - list directory contents'), true)
        this.addOutput(cmd('  cd        ', ' - change directory'), true)
        this.addOutput(cmd('  cat       ', ' - print file contents'), true)
        this.addOutput(cmd('  pwd       ', ' - print working directory'), true)
        this.addOutput(cmd('  help      ', ' - show this help message'), true)
        this.addOutput(cmd('  clear     ', ' - clear the terminal'), true)
        this.addOutput(cmd('  exit      ', ' - shutdown'), true)
        this.addOutput('')
    }

    clear() {
        const output = document.getElementById('terminal-output')
        output.innerHTML = ''
    }

    pwd() {
        this.addOutput(this.cwd)
    }

    ls(cmd) {
        const args = cmd.trim().split(/\s+/).slice(1)
        const showHidden = args.includes('-a')
        const pathArg = args.find(a => !a.startsWith('-'))
        const targetPath = pathArg ? fsResolve(this.cwd, pathArg) : this.cwd

        const node = fsGet(targetPath)
        if (!node) {
            this.addOutput(`ls: ${pathArg || this.cwd}: no such file or directory`, false, 'error')
            return
        }
        if (node.type !== 'dir') {
            this.addOutput(`ls: ${pathArg}: not a directory`, false, 'error')
            return
        }

        this.addOutput('')
        for (const [name, child] of Object.entries(node.children)) {
            if (!showHidden && child.hidden) continue
            if (child.type === 'dir') {
                this.addOutput(`<span style="color:#06d092">${name}/</span>`, true)
            } else {
                this.addOutput(name)
            }
        }
        this.addOutput('')
    }

    cd(cmd) {
        const args = cmd.trim().split(/\s+/).slice(1)
        const pathArg = args[0]

        if (!pathArg || pathArg === '~') {
            this.cwd = '/dev/null/void'
            return
        }

        const target = fsResolve(this.cwd, pathArg)

        // Prevent navigating above /dev/null/void
        if (!target.startsWith('/dev/null/void')) {
            this.addOutput(`cd: permission denied: cannot escape the void`, false, 'error')
            return
        }

        const node = fsGet(target)
        if (!node) {
            this.addOutput(`cd: ${pathArg}: no such file or directory`, false, 'error')
            return
        }
        if (node.type !== 'dir') {
            this.addOutput(`cd: ${pathArg}: not a directory`, false, 'error')
            return
        }

        this.cwd = target
    }

    cat(cmd) {
        const args = cmd.trim().split(/\s+/).slice(1)
        const pathArg = args[0]

        if (!pathArg) {
            this.addOutput('cat: missing operand', false, 'error')
            return
        }

        const target = fsResolve(this.cwd, pathArg)
        const node = fsGet(target)

        if (!node) {
            this.addOutput(`cat: ${pathArg}: no such file or directory`, false, 'error')
            return
        }
        if (node.type === 'dir') {
            this.addOutput(`cat: ${pathArg}: is a directory`, false, 'error')
            return
        }

        this.addOutput('')
        for (const line of node.content) {
            this.addOutput(line, !!node.html)
        }
        this.addOutput('')
    }

    exit() {
        this.addOutput('')
        this.addOutput('good bye.')

        // Hide input line
        const inputLine = document.querySelector('.terminal-input-line')
        inputLine.classList.add('hidden')

        // Trigger TV shutoff after a brief delay
        setTimeout(() => {
            document.body.classList.remove('tv-on', 'animation-complete')
            document.body.classList.add('tv-off')
        }, 500)
    }
}

// Initialize terminal when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.terminal = new Terminal()
})
