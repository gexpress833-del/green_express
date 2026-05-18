import './bootstrap';

// Dark mode toggle with Alpine.js
document.addEventListener('alpine:init', () => {
    Alpine.data('darkMode', () => ({
        dark: false,

        init() {
            // Check localStorage or system preference
            if (localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                this.dark = true;
                document.documentElement.classList.add('dark');
            } else {
                this.dark = false;
                document.documentElement.classList.remove('dark');
            }

            // Watch for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.dark = e.matches;
                    this.applyTheme();
                }
            });
        },

        toggle() {
            this.dark = !this.dark;
            this.applyTheme();
            localStorage.setItem('theme', this.dark ? 'dark' : 'light');
        },

        applyTheme() {
            if (this.dark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }));
});
