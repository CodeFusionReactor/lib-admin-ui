namespace api.dom {

    export class ButtonEl extends FormItemEl {

        constructor(className?: string) {
            super('button', className, api.StyleHelper.COMMON_PREFIX);
        }

    }
}
