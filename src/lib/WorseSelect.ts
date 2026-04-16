const DEFAULT_CONFIG = {
    searchable: false,
    multiselect: false,
    fixed: false
};

type SelectConfig = typeof DEFAULT_CONFIG;
type ConfigKey = keyof SelectConfig;

class WorseSelect {
    selectElement: HTMLSelectElement;
    config: SelectConfig;

    constructor(selectElement: HTMLSelectElement, config: Partial<SelectConfig> = {}) {
        this.selectElement = selectElement;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
}

const configKeys = Object.keys(DEFAULT_CONFIG);

export function worseSelect() {
    const selectElements = [...document.querySelectorAll<HTMLSelectElement>('select')];

    selectElements.forEach(selectElement => {
        const worseSelectElement = buildSelect(new WorseSelect(selectElement, getConfig(selectElement)));
        synchronizeSelects(worseSelectElement, selectElement);
        handleOptionChanges(worseSelectElement, selectElement);
        renderSelect( worseSelectElement, selectElement);
    });
}

function getConfig(selectElement: Element) {
    return Object.fromEntries(
        [...selectElement.attributes].map(attr => {
            const val = attr.value;
            const parsedValue = val === 'true' ? true : val === 'false' ? false : val;

            return [attr.name, parsedValue] as const;
        }).filter(([name]) => configKeys.includes(name as ConfigKey))
    ) as Partial<SelectConfig>;
}

function buildSelect(worseSelectModel: WorseSelect) {
    const htmlString = `
    <div class="worse-select-container">
      <div class="worse-select-header">
      </div>
      <div class="worse-select-options">
        ${[... worseSelectModel.selectElement.options].map(option => 
           `<div class="worse-select-toption">${option.textContent}</div>`
        ).join('')};
      </div>
    </div>
    `
    return (document.createRange().createContextualFragment(htmlString).firstElementChild as HTMLDivElement);
}

function synchronizeSelects(worseSelect: Element, select: HTMLSelectElement) {
    const worstSelectOptions = (worseSelect.querySelector('.worse-select-options') as HTMLDivElement).childNodes;

    [... worstSelectOptions ?? []].forEach((worseOption, index) => {
        const selectOption = select.options.item(index);
        worseOption.addEventListener('click', () => {
            selectOption?.click();
        });
        const worseOptionEl = worseOption.parentElement?.children[0] as HTMLElement;
        selectOption?.addEventListener('click', () => worseOptionEl.click());
    });
}

function handleOptionChanges(worseSelect: HTMLElement, select: HTMLSelectElement) {
    const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((selectOption: Node) => {
                    const worstSelectOptions = (worseSelect.querySelector('.worse-select-options') as HTMLDivElement).childNodes;
                    const evenWorseOption = worstSelectOptions[0].cloneNode(true) as HTMLElement;
                    const htmlSelectOption = (selectOption as HTMLOptionElement)
                    const selectOptionCollection = selectOption.parentElement?.children;

                    evenWorseOption.dataset.value = (selectOption as HTMLOptionElement).value;

                    if (selectOptionCollection) {
                        const optionIndex = [...selectOptionCollection].indexOf(htmlSelectOption);
                        const worseOption = worseSelect.children[optionIndex-1];

                        worseOption.after(evenWorseOption);
                    }
                    worseSelect.appendChild(evenWorseOption);
                });
                mutation.removedNodes.forEach((node: Node) => {
                    const selectOptionValue = (node as HTMLOptionElement).value
                    const worseOption = worseSelect.querySelector(`div[data-value="${selectOptionValue}"]`) as HTMLDivElement;
                    worseOption.remove();
                });
            }
        }
    });

    const config: MutationObserverInit = {
        childList: true, // Captures adding/removing direct children
        subtree: false   // Set to true if you also want to watch children's children
    };

    observer.observe(select, config);
}

function renderSelect(worseSelectElement: HTMLDivElement, selectElement: HTMLSelectElement ) {

    const rect = selectElement.getBoundingClientRect();

    worseSelectElement.style.display = 'none';
    selectElement.before(worseSelectElement);

    worseSelectElement.style.position = 'absolute';
    worseSelectElement.style.top = `${rect.top}px`;
    worseSelectElement.style.left = `${rect.left}px`;
    worseSelectElement.style.zIndex = selectElement.style.zIndex+1;

    selectElement.style.display = 'none';
    worseSelectElement.style.display = 'block';
}
