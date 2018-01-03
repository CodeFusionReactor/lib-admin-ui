namespace api.content.form.inputtype.time {

    import support = api.form.inputtype.support;
    import Property = api.data.Property;
    import Value = api.data.Value;
    import ValueType = api.data.ValueType;
    import ValueTypes = api.data.ValueTypes;
    import DateTimePicker = api.ui.time.DateTimePicker;
    import DateTimePickerBuilder = api.ui.time.DateTimePickerBuilder;

    /**
     * Uses [[api.data.ValueType]] [[api.data.ValueTypeLocalDateTime]].
     */
    export class DateTime extends support.BaseInputTypeNotManagingAdd {

        private withTimezone: boolean = false;
        private valueType: ValueType = ValueTypes.LOCAL_DATE_TIME;

        constructor(config: api.form.inputtype.InputTypeViewContext) {
            super(config);
            this.readConfig(config.inputConfig);
        }

        private readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
            let timeZoneConfig = inputConfig['timezone'] && inputConfig['timezone'][0];
            let timeZone = timeZoneConfig && timeZoneConfig['value'];

            if (timeZone === 'true') {
                this.withTimezone = true;
                this.valueType = ValueTypes.DATE_TIME;
            }
        }

        getValueType(): ValueType {
            return this.valueType;
        }

        newInitialValue(): Value {
            return super.newInitialValue() || this.valueType.newNullValue();
        }

        createInputOccurrenceElement(_index: number, property: Property): api.dom.Element {
            if (this.valueType === ValueTypes.DATE_TIME) {
                return this.createInputAsDateTime(property);
            }

            return this.createInputAsLocalDateTime(property);
        }

        updateInputOccurrenceElement(occurrence: api.dom.Element, property: api.data.Property, unchangedOnly: boolean) {
            let dateTimePicker = <DateTimePicker> occurrence;

            if (!unchangedOnly || !dateTimePicker.isDirty()) {

                let date = property.hasNonNullValue()
                    ? this.valueType === ValueTypes.DATE_TIME
                               ? property.getDateTime().toDate()
                               : property.getLocalDateTime().toDate()
                    : null;
                dateTimePicker.setSelectedDateTime(date);
            }
        }

        resetInputOccurrenceElement(occurrence: api.dom.Element) {
            let input = <DateTimePicker> occurrence;

            input.resetBase();
        }

        hasInputElementValidUserInput(inputElement: api.dom.Element) {
            let dateTimePicker = <api.ui.time.DateTimePicker>inputElement;
            return dateTimePicker.isValid();
        }

        availableSizeChanged() {
            // Nothing
        }

        valueBreaksRequiredContract(value: Value): boolean {
            return value.isNull() || !(value.getType().equals(ValueTypes.LOCAL_DATE_TIME) || value.getType().equals(ValueTypes.DATE_TIME));
        }

        private createInputAsLocalDateTime(property: Property) {
            let dateTimeBuilder = new DateTimePickerBuilder();

            if (!ValueTypes.LOCAL_DATE_TIME.equals(property.getType())) {
                property.convertValueType(ValueTypes.LOCAL_DATE_TIME);
            }

            if (property.hasNonNullValue()) {
                let date = property.getLocalDateTime();
                dateTimeBuilder.setDate(date.toDate());
            }

            let dateTimePicker = dateTimeBuilder.build();

            dateTimePicker.onSelectedDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                let value = new Value(event.getDate() != null ? api.util.LocalDateTime.fromDate(event.getDate()) : null,
                    ValueTypes.LOCAL_DATE_TIME);
                this.notifyOccurrenceValueChanged(dateTimePicker, value);
            });

            return dateTimePicker;
        }

        private createInputAsDateTime(property: Property) {
            let dateTimeBuilder = new DateTimePickerBuilder();
            dateTimeBuilder.setUseLocalTimezoneIfNotPresent(true);

            if (!ValueTypes.DATE_TIME.equals(property.getType())) {
                property.convertValueType(ValueTypes.DATE_TIME);
            }

            if (property.hasNonNullValue()) {
                let date: api.util.DateTime = property.getDateTime();
                dateTimeBuilder.setDate(date.toDate()).setTimezone(date.getTimezone());
            }

            let dateTimePicker = new DateTimePicker(dateTimeBuilder);
            dateTimePicker.onSelectedDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                let value = new Value(event.getDate() != null ? api.util.DateTime.fromDate(event.getDate()) : null,
                    ValueTypes.DATE_TIME);
                this.notifyOccurrenceValueChanged(dateTimePicker, value);
            });
            return dateTimePicker;
        }

        static getName(): api.form.InputTypeName {
            return new api.form.InputTypeName('DateTime', false);
        }
    }
    api.form.inputtype.InputTypeManager.register(new api.Class('DateTime', DateTime));

}
