namespace api.app.wizard {

    export class WizardHeader extends api.dom.DivEl {

        private propertyChangedListeners: {(event: api.PropertyChangedEvent):void}[] = [];

        constructor() {
            super('wizard-header');
        }

        onPropertyChanged(listener: (event: api.PropertyChangedEvent)=>void) {
            this.propertyChangedListeners.push(listener);
        }

        unPropertyChanged(listener: (event: api.PropertyChangedEvent)=>void) {
            this.propertyChangedListeners =
            this.propertyChangedListeners.filter((currentListener: (event: api.PropertyChangedEvent)=>void) => {
                return listener !== currentListener;
            });
        }

        notifyPropertyChanged(property: string, oldValue: string, newValue: string) {
            let event = new api.PropertyChangedEvent(property, oldValue, newValue);
            this.propertyChangedListeners.forEach((listener: (event: api.PropertyChangedEvent)=>void) => {
                listener.call(this, event);
            });
        }

        isValid(): boolean {
            return true;
        }

        giveFocus(): boolean {
            return false;
        }
    }
}
