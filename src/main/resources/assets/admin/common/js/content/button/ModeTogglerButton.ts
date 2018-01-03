namespace api.content.button {

    import TogglerButton = api.ui.button.TogglerButton;
    import Tooltip = api.ui.Tooltip;
    import i18n = api.util.i18n;

    export class ModeTogglerButton
        extends TogglerButton {

        private tooltip: Tooltip;

        constructor() {
            super('mode-toggler-button');

            this.addClass('icon-tree');

            this.setEnabled(true);

            this.tooltip = new Tooltip(this, '', 1000);
            this.tooltip.setMode(Tooltip.MODE_GLOBAL_STATIC);

            this.onActiveChanged((isActive: boolean) => {
                let isVisible = this.tooltip.isVisible();
                if (isVisible) {
                    this.tooltip.hide();
                }
                this.tooltip.setText(isActive ? i18n('tooltip.combobox.treemode.disable') :  i18n('tooltip.combobox.treemode.enable'));
                if (isVisible) {
                    this.tooltip.show();
                }
            });
        }
    }
}
