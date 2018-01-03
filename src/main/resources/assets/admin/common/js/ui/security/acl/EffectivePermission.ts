namespace api.ui.security.acl {

    export class EffectivePermission {

        private access: Access;

        private permissionAccess: EffectivePermissionAccess;

        public getAccess(): Access {
            return this.access;
        }

        public getPermissionAccess(): EffectivePermissionAccess {
            return this.permissionAccess;
        }

        public getMembers(): EffectivePermissionMember[] {
            return this.permissionAccess.getUsers();
        }

        static fromJson(json: api.content.json.EffectivePermissionJson) {

            let effectivePermission = new EffectivePermission();

            effectivePermission.access = Access[json.access];
            effectivePermission.permissionAccess = EffectivePermissionAccess.fromJson(json.permissionAccessJson);

            return effectivePermission;
        }

    }

}
