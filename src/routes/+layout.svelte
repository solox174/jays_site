<script lang="ts">
    import './layout.css';
    import {page} from '$app/state';
    import {isBusy} from '$lib/stores/ui.svelte';
    import {theme} from '$lib/stores/colorScheme.svelte';
    import logo from '$lib/assets/images/jays_auto.svg';

    let {children, data} = $props();
    let mouseX = $state(0);
    let mouseY = $state(0);
    let mobileMenuOpen = $state(false);
    let settingsMenuOpen = $state(false);
    // svelte-ignore non_reactive_update
    let navBtnEl: HTMLElement | null = null;
    // svelte-ignore non_reactive_update
    let settingsEl: HTMLElement | null = null;
    const ea = ['gmail', 'com', 'jaysautocarcare'];
    const m2 = 'ai';
    const e = `${ea[2]}@${ea[0]}.${ea[1]}`;
    const se = () => window.location.href = `m${m2}lto:${e}`;

    function handleMouseMove(event: MouseEvent) {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }

    function toggleTheme() {
        theme.toggle();
        document.documentElement.setAttribute('data-theme', theme.current);
    }

    function handleWindowClick(e: MouseEvent) {
        if (settingsEl) {
            if (settingsEl.querySelector('button')?.contains(e.target as Node)) {
                settingsMenuOpen = !settingsMenuOpen;
            } else if (!settingsEl.contains(e.target as Node)) {
                settingsMenuOpen = false;
            }
        }
        if (navBtnEl) {
            if (navBtnEl.querySelector('button')?.contains(e.target as Node)) {
                mobileMenuOpen = !mobileMenuOpen;
            } else if (!navBtnEl.contains(e.target as Node)) {
                mobileMenuOpen = false;
            }
        }
    }
</script>

<svelte:window onclick={handleWindowClick} onmousemove={handleMouseMove}/>
<div style="display: flex; flex-direction: column; height: 100dvh">
    <div>
        <div style="position: relative; display: flex; justify-content: center; padding: 16px 0">
            <a href="/" title="home" style="margin-bottom:10px">
                <img alt="logo" id="hero" src="{logo}" style="height: var(--hero-height); width: auto;"/>
            </a>
            <!-- TODO: consider refactoring menu here and for mobile into a Component. Low priority  -->
            <div bind:this={navBtnEl} class="nav-mobile-trigger">
                <button aria-expanded={mobileMenuOpen} aria-label="Menu" class="bare-btn" style="padding-left: 0">
                    <i class="fa-solid fa-bars"></i>
                </button>
                {#if mobileMenuOpen}
                    <div class="nav-dropdown">
                        <a class:active-nav="{page.url.pathname === '/'}" href="/"
                           onclick={() => mobileMenuOpen = false}>Home</a>
                        <a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling"
                           onclick={() => mobileMenuOpen = false}>Scheduling</a>
                        <a class:active-nav="{page.url.pathname === '/services'}" href="/services"
                           onclick={() => mobileMenuOpen = false}>Services</a>
                        <a class:active-nav="{page.url.pathname === '/portfolio'}" href="/portfolio"
                           onclick={() => mobileMenuOpen = false}>Portfolio</a>
                    </div>
                {/if}
            </div>

            <div bind:this={settingsEl} class="nav-settings"
                 style="position: absolute; margin-top: 20px; top: 0; right: 0; font-size: 1.3rem">
                <button aria-expanded={settingsMenuOpen} aria-label="Settings" class="bare-btn"
                        style="padding-right: 0">
                    <i class="fa-solid fa-user-gear" style="font-size: 1.5rem"></i>
                </button>
                {#if settingsMenuOpen}
                    <div class="nav-dropdown" style="width: 250px">
                        {#if data.loggedIn}
                            <a href="/profile" onclick={() => settingsMenuOpen = false}>Edit Profile</a>
                            <a href="/logout" onclick={() => settingsMenuOpen = false}>Logout</a>
                        {:else}
                            <a href="/login" onclick={() => settingsMenuOpen = false}>Log In</a>
                        {/if}
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.25rem; font-size: 1.2rem; border-bottom: 1px solid var(--overlay-border); background: var(--item-bg);">
                            <span id="theme-toggle-label">{theme.current === 'dark' ? 'Light' : 'Dark'} Theme</span>
                            <!-- TODO: could be a Component. Low priority -->
                            <label class="switch">
                                <input type="checkbox" checked={theme.current === 'dark'} onchange={toggleTheme}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
        {#if page.url.pathname !== '/login' && page.url.pathname !== '/create-account'}
            <nav>
                <div class="nav-desktop">
                    <a class:active-nav="{page.url.pathname === '/'}" href="/">Home</a>
                    <a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling">Scheduling</a>
                    <a class:active-nav="{page.url.pathname === '/services'}" href="/services">Services</a>
                    <a class:active-nav="{page.url.pathname === '/portfolio'}" href="/portfolio">Portfolio</a>
                </div>

            </nav>
        {/if}
        <div></div>
    </div>

    <main style="flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; padding: 20px 0 45px; box-sizing: border-box">
        {@render children()}
    </main>

    <div id="footer-bar">
        <a id="footer-tel" href="tel:+14808195443" title="phone">
            <i class="fa-solid fa-phone footer-icon"></i>
            <span id="footer-tel-text" class="footer-text"></span>
        </a>
        <span id="footer-e"
              onclick="{se}" style="margin-left: 5px"
              title="{e}"
              role="button"
              tabindex="0"
              onkeyup="{void(0)}">
            <i class="fa-solid fa-envelope footer-icon"></i>
            <span id="footer-e-text" class="footer-text">{e}</span>
        </span>
        <span id="footer-copy" style="font-size: 0.75rem">
			<i id="footer-copy-icon" class="fa-solid fa-copyright footer-icon"></i>
			<span id="footer-copy-text" class="footer-text">2026 Fasthold Inc.</span>
		</span>
    </div>
</div>

<div aria-hidden="true"
     class="cursor-spinner"
     class:visible={isBusy.state}
     style="position: fixed; z-index: 9999"
     style:left={`${mouseX}px`}
     style:top={`${mouseY}px`}>
    <i class="fa-solid fa-spinner fa-spin fa-3x"></i>
</div>
{#if isBusy.state}
    <div class="busy-overlay" aria-hidden="true"></div>
{/if}

<style>

    /** nav **/
    .nav-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        background: var(--surface-overlay);
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-modal);
        z-index: 100;
        display: flex;
        flex-direction: column;
    }

    .nav-dropdown a:not(:last-child) {
        margin-bottom: 4px;
    }
    .nav-dropdown > * {
        padding: 0.5rem 1.25rem;
        font-size: 1.2rem;
        background: var(--item-bg);
    }

    .nav-dropdown a:hover {
        background: var(--item-bg-hover);
        text-decoration: none;
    }

    .nav-mobile-trigger .nav-dropdown {
        left: 0;
        transform: none;
    }

    .nav-desktop a {
        color: #d3d3d3;
        transition: color 180ms ease;
        font-weight: 500;
    }

    .nav-desktop a:hover {
        color: white;
        text-decoration: none;
    }

    .nav-desktop .active-nav {
        color: white;
        text-decoration: underline;
        text-decoration-color: var(--brand-color);
        text-decoration-thickness: 2px;
        text-underline-offset: 7px;
    }

    .nav-desktop {
        display: flex;
        justify-content: space-between;
        margin: 0 auto;
        width: 500px;
        font-size: 1.5rem;
    }

    .nav-settings {
        position: relative;
    }

    .nav-mobile-trigger {
        display: none;
        position: absolute;
        left: 0;
        top: 0;
        margin-top: 8px;
    }

    /** footer **/
    #footer-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--overlay-backdrop);
        backdrop-filter: blur(4px);
        padding: 5px 0;
        text-align: center;
        font-size: .9rem;
        font-weight: 500;
    }

    #footer-e {
        margin-left: 10px;
        cursor: pointer;
    }

    #footer-e:hover {
        text-decoration: underline;
    }

    #footer-copy {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
    }

    .footer-icon {
        color: white;
    }

    .footer-text {
        color: #aeaeae;
    }

    #footer-tel-text::before {
        content: '(480) 819-5443';
    }

    /** mobile **/
    @media (max-width: 640px) {
        #footer-bar {
            display: flex;
            justify-content: space-around;
            align-items: center;
        }

        #footer-copy {
            position: static;
            font-size: inherit;
            transform: none;
        }

        #footer-copy-icon {
            display: inline;
        }

        #footer-e-text, #footer-copy-text, #footer-tel-text {
            display: none;
        }
        .footer-icon {
            color: #aeaeae;
        }

        .footer-text {
            color: white;
        }
        #hero {
            margin-top: 10px;
        }

        .nav-desktop {
            display: none;
        }

        .nav-mobile-trigger {
            display: block;
        }

        .nav-settings, .nav-mobile-trigger {
            margin-top: 20px !important;
        }

        .nav-settings .nav-dropdown {
            left: auto;
            right: 0;
            transform: none;
        }
    }

    /** light/dark toggle **/
    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 20px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 12px;
        width: 12px;
        left: 4px;
        bottom: 4px;
        background-color: #4a4a4a;
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: var(--action-border);
    }

    input:checked + .slider:before {
        transform: translateX(30px);
    }
    
    :root[data-theme="dark"] .slider:before {
        background-color: white;
    }
</style>
