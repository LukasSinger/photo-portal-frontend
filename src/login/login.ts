import { Component, inject, model, signal } from "@angular/core";
import { Router } from "@angular/router";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { PasswordModule } from "primeng/password";

import { LoginService } from "../services/LoginService";

@Component({
    selector: ".page.login",
    imports: [FormsModule, CardModule, ButtonModule, PasswordModule],
    templateUrl: "./login.html",
    styleUrl: "./login.css"
})
export class Login {
    private router = inject(Router);
    private loginService = inject(LoginService);

    protected passcode = model("");
    protected loading = signal(false);
    protected tryAgain = signal("");

    protected async passcodeSubmit(ev: KeyboardEvent) {
        if (ev.key === "Enter") this.authenticate();
    }

    protected async authenticate() {
        if (this.passcode().length < 1) {
            this.tryAgain.set("Passcode is required.");
            return;
        }
        this.tryAgain.set("");
        this.loading.set(true);
        fetch("check_password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: this.passcode()
            })
        })
            .then((res) => {
                this.loading.set(false);
                if (!res.ok) throw new Error();
                else return res.json();
            })
            .then((data) => {
                if (data.user_id) {
                    this.loginService.logIn(data.user_id, data.user_type, data.user_name, this.passcode());
                    this.router.navigateByUrl("/collections");
                } else {
                    this.tryAgain.set("Incorrect passcode.");
                }
            })
            .catch(() => {
                this.loading.set(false);
                this.tryAgain.set("Something went wrong. Please try again.");
            });
    }
}
