import { Component, inject, model, signal, type WritableSignal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { DatePickerModule } from "primeng/datepicker";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { ImageModule } from "primeng/image";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from "primeng/progressspinner";

import { LoginService } from "../services/LoginService";
import { type UserField } from "../collections/collections";
import { type DBUser } from "../users/users";

type Photo = {
    photo_id: number;
    label: string;
    date: string;
    location: string;
    url: string;
};

type PhotoField = {
    url: WritableSignal<string>;
    label: WritableSignal<string>;
};

@Component({
    selector: ".page.portal",
    imports: [FormsModule, DialogModule, DatePickerModule, InputTextModule, TableModule, ImageModule, ButtonModule, ProgressSpinnerModule],
    templateUrl: "./collection.html",
    styleUrl: "./collection.css"
})
export class Collection {
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    protected loginService = inject(LoginService);
    protected id = signal(-1);
    public name = signal("");

    protected newShootDialogShowing = signal(false);
    protected newShootDate = signal<Date | undefined>(undefined);
    protected newShootLocation = signal("");
    protected newShootType = signal("");
    protected newShootPhotographers = signal<UserField[]>([]);
    protected newShootPhotos = signal<PhotoField[]>([]);

    protected hasLoaded = signal(false);
    protected isUpdating = signal(false);
    protected photos = signal<Photo[]>([]);

    constructor() {
        this.activatedRoute.params.subscribe((params) => {
            this.id.set(params["id"]);
            this.refreshContents();
        });
        this.name.set(this.router.currentNavigation()?.extras.state?.["name"]);
    }

    protected showNewShootDialog() {
        this.newShootPhotos.set([]);
        this.addUserToForm();
        this.addPhotoToForm();
        this.newShootDialogShowing.set(true);
    }

    protected addUserToForm() {
        this.newShootPhotographers().push({ name: signal("") });
    }

    protected addPhotoToForm() {
        this.newShootPhotos().push({ url: signal(""), label: signal("") });
    }

    protected async createShoot() {
        const newDate = this.newShootDate();
        if (newDate === undefined) return;
        this.isUpdating.set(true);

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
        for (const addUser of this.newShootPhotographers()) {
            const user = users.find((el: DBUser) => el["user_name"] === addUser.name());
            if (user === undefined) {
                alert(`"${addUser.name()}" is not the name of a registered user. Please try again.`);
                this.isUpdating.set(false);
                return;
            } else userIds.push(user.user_id);
        }

        // Create entry in Shoot table
        const dateStr = newDate.getFullYear() + String(newDate.getMonth() + 1).padStart(2, "0") + String(newDate.getDate()).padStart(2, "0");
        const shoot = {
            date: dateStr,
            location: this.newShootLocation(),
            type: this.newShootType(),
            photographer_id: userIds
        };

        const shootId = await fetch("add_shoot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(shoot)
        })
            .then((res) => res.json())
            .then((data) => {
                return data.Shoot_id;
            })
            .catch(() => {
                alert("Please try again.");
            });
        if (!shootId) {
            this.isUpdating.set(false);
            return;
        }

        // Create entries in Photo table
        const newURLs: string[] = [];
        const newLabels: string[] = [];
        for (const newPhoto of this.newShootPhotos()) {
            newURLs.push(newPhoto.url());
            newLabels.push(newPhoto.label());
        }
        const photoReq = {
            collection_id: this.id(),
            shoot_id: shootId,
            labels: newLabels,
            urls: newURLs
        };
        const success = await fetch("add_photo_collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(photoReq)
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                else return true;
            })
            .catch(() => {
                alert("Please try again.");
                return false;
            });
        if (success) {
            this.refreshContents();
            this.newShootDialogShowing.set(false);
        }
        this.isUpdating.set(false);
    }

    protected refreshContents() {
        // Get contents of this collection
        this.isUpdating.set(true);
        fetch("get_photos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: this.loginService.getUserId(),
                type: this.loginService.getUserType(),
                collection_id: this.id()
            })
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                else return res.json();
            })
            .then((data) => {
                // Render contents to page
                this.photos.set(data);
                this.isUpdating.set(false);
                this.hasLoaded.set(true);
            });
    }

    protected deletePhoto(id: number) {
        this.isUpdating.set(true);
        fetch("delete_photo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                photo_id: id
            })
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                else return res.json();
            })
            .then((data) => {
                this.refreshContents();
                this.isUpdating.set(false);
            });
    }
}
