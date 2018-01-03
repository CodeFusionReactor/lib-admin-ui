namespace api.ui.tab {

    export class TabMenuButton extends api.dom.DivEl {

        private labelEl: api.dom.AEl;

        constructor() {
            super('tab-menu-button');

            this.labelEl = new api.dom.AEl('label');
            this.appendChild(this.labelEl);
        }

        setLabel(value: string, addTitle: boolean = true) {
            this.labelEl.setHtml(value);
            if (addTitle) {
                this.labelEl.getEl().setAttribute('title', value);
            }
        }

        getLabel(): api.dom.AEl {
            return this.labelEl;
        }

        focus(): boolean {
            return this.labelEl.giveFocus();
        }
    }
}
