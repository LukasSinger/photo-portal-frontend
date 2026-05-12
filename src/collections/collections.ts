import { Component, inject, signal, type WritableSignal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { CardModule } from "primeng/card";
import { ProgressSpinnerModule } from "primeng/progressspinner";

import { LoginService } from "../services/LoginService";
import { type DBUser } from "../users/users";

type Collection = {
    collection_id: number;
    collection_name: string;
};

export type UserField = {
    name: WritableSignal<string>;
};

@Component({
    selector: ".page.portal",
    imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, TableModule, CardModule, ProgressSpinnerModule, RouterLink],
    templateUrl: "./collections.html",
    styleUrl: "./collections.css"
})
export class Collections {
    protected loginService = inject(LoginService);

    protected newCollectionDialogShowing = signal(false);
    protected newCollectionName = signal("");
    protected newCollectionUsers = signal<UserField[]>([]);
    protected isUpdating = signal(false);

    protected collections: WritableSignal<Collection[]> = signal([]);

    protected ngOnInit() {
        this.refreshContents();
    }

    protected async refreshContents() {
        // Get contents of this collection
        this.isUpdating.set(true);
        await fetch("show_collection", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: this.loginService.getUserId(),
                type: this.loginService.getUserType()
            })
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                else return res.json();
            })
            .then((data) => {
                this.collections.set(data);
            })
            .catch();
        this.isUpdating.set(false);
    }

    protected showNewCollectionDialog() {
        this.newCollectionUsers.set([]);
        this.addUserToForm();
        this.newCollectionDialogShowing.set(true);
    }

    protected addUserToForm() {
        this.newCollectionUsers().push({ name: signal("") });
    }

    protected async createCollection() {
        // Get user catalog
        const users: DBUser[] = await fetch("show_users", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
            .then((res) => res.json())
            .then((data) => {
                return data;
            })
            .catch(() => {
                alert("Please try again.");
                return [];
            });
        if (users.length === 0) {
            this.isUpdating.set(false);
            return;
        }

        // Get user_ids of inputted users
        const userIds = [];
        for (const addUser of this.newCollectionUsers()) {
            const user = users.find((el: DBUser) => el["user_name"] === addUser.name());
            if (user === undefined) {
                alert(`"${addUser.name()}" is not the name of a registered user. Please try again.`);
                this.isUpdating.set(false);
                return;
            } else userIds.push(user.user_id);
        }

        // Create entry in Collection table
        const collection = {
            collection_names: [this.newCollectionName()],
            user_ids: userIds
        };
        const success = await fetch("add_collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(collection)
        })
            .then((res) => res.json())
            .then((data) => {
                return true;
            })
            .catch(() => {
                alert("Please try again.");
            });
        if (success) {
            this.refreshContents();
            this.newCollectionDialogShowing.set(false);
        }
        this.isUpdating.set(false);
    }
}
