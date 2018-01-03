namespace api.ui.button {

    export class CloseButton extends api.ui.button.Button {

        constructor(className?: string) {
            super();
            this.addClass('close-button icon-small icon-close');
            if (className) {
                this.addClass(className);
            }
        }
    }

}
