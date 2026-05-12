import { Component, inject, model, signal } from "@angular/core";
import { Router } from "@angular/router";

import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectButtonModule } from "primeng/selectbutton";
import { TableModule } from "primeng/table";
import { ProgressSpinnerModule } from "primeng/progressspinner";

export type DBUser = {
    user_id: number;
    user_name: string;
    shoot_id: number;
};

type UserEntry = {
    id: number;
    name: string;
    shootCount: number;
};

@Component({
    selector: ".page.portal",
    imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, SelectButtonModule, TableModule, ProgressSpinnerModule],
    templateUrl: "./users.html",
    styleUrl: "./users.css"
})
export class Users {
    protected userTypeOptions = [
        {
            label: "Customer",
            value: 1
        },
        {
            label: "Photographer",
            value: 2
        },
        {
            label: "Admin",
            value: 3
        }
    ];

    private router = inject(Router);

    protected hasLoaded = signal(false);
    protected isUpdating = signal(false);
    protected isUpdatingPw = signal(false);
    protected users = signal<UserEntry[]>([]);

    protected newUserDialogShowing = model(false);
    protected userType = model(1);
    protected userName = model("");
    protected userCode = model("");

    protected editUserDialogShowing = model(false);
    protected editUser = signal<UserEntry | undefined>(undefined);
    protected editUserPw = signal("");

    protected ngOnInit() {
        this.refreshContents();
    }

    protected refreshContents() {
        // Get all users
        this.isUpdating.set(true);
        fetch("show_users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                else return res.json();
            })
            .then((data: DBUser[]) => {
                // Render contents to page
                this.users.set([]);
                for (const user of data) {
                    const matchIndex = this.users().findIndex((el) => el.id === user.user_id);
                    if (matchIndex > -1) {
                        this.users()[matchIndex].shootCount++;
                    } else {
                        this.users().push({
                            id: user.user_id,
                            name: user.user_name,
                            shootCount: user.shoot_id !== null ? 1 : 0
                        });
                    }
                }
                this.isUpdating.set(false);
                this.hasLoaded.set(true);
            });
    }

    protected showNewUserDialog() {
        this.newUserDialogShowing.set(true);
    }

    protected async createUser() {
        this.isUpdating.set(true);
        if (!(await this.validatePassword(this.userCode()))) {
            this.isUpdating.set(false);
            return;
        }
        const user = {
            user_type: this.userType(),
            user_name: this.userName(),
            passcode_hash: this.userCode()
        };

        fetch("add_user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        })
            .then((res) => res.json())
            .then((data) => {
                this.refreshContents();
                this.newUserDialogShowing.set(false);
            })
            .catch(() => {
                alert("Please try again.");
            });
    }

    protected showEditUserDialog(user: UserEntry) {
        this.editUser.set(user);
        this.editUserPw.set("");
        this.editUserDialogShowing.set(true);
    }

    protected async updatePassword() {
        this.isUpdatingPw.set(true);
        if (!(await this.validatePassword(this.editUserPw()))) return;
        fetch("update_password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: this.editUser()?.id,
                new_password: this.editUserPw()
            })
        })
            .then((res) => res.json())
            .then((data) => {
                this.editUserDialogShowing.set(false);
                this.isUpdatingPw.set(false);
            })
            .catch(() => {
                alert("Please try again.");
            });
    }

    protected async validatePassword(newPw: string) {
        // Validate format
        if (newPw.length !== 6) {
            alert("Passcode must be 6 digits long.");
            return false;
        }
        // Validate uniqueness in database
        return await fetch("check_password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: newPw
            })
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                else return res.json();
            })
            // If no match was found, this passcode isn't taken yet
            .then((data) => {
                if (data.user_id) {
                    alert("Another user already has this passcode. Enter a new passcode.");
                    return false;
                } else return true;
            })
            .catch(() => {
                alert("Something went wrong. Please try again.");
                return false;
            });
    }
}
