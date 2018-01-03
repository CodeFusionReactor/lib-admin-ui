namespace api.form {

    export class InputLabel extends api.dom.DivEl {

        private input:Input;

        constructor(input:Input) {
            super('input-label');

            this.input = input;

            let wrapper = new api.dom.DivEl('wrapper', api.StyleHelper.COMMON_PREFIX);
            let label = new api.dom.DivEl('label');
            label.getEl().setInnerHtml(input.getLabel());
            wrapper.getEl().appendChild(label.getHTMLElement());

            if( input.getOccurrences().required() ) {
                wrapper.addClass('required');
            }

            this.getEl().appendChild(wrapper.getHTMLElement());
        }
    }
}
