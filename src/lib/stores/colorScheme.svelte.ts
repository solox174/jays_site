import {browser} from '$app/environment';

const savedTheme = (browser && localStorage.getItem('theme')) || 'dark';

if (browser) {
    document.documentElement.setAttribute('data-theme', savedTheme);
}

export const theme = $state({
    current: savedTheme,

    toggle() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        if (browser) {
            localStorage.setItem('theme', this.current);
            document.documentElement.style.setProperty('color-scheme', this.current);

            document.documentElement.setAttribute('data-theme', this.current);
        }
    }
});