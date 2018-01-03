namespace api.ui {

    export class FontIcon extends api.dom.DivEl {
        constructor(iconClass: string) {
            super('font-icon ' + iconClass, api.StyleHelper.getCurrentPrefix());
        }
    }
}
