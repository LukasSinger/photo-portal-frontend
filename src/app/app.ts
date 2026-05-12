import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { ToolbarModule } from "primeng/toolbar";

import { LoginService } from "../services/LoginService";

@Component({
    selector: "app-root",
    imports: [RouterOutlet, RouterLink, ToolbarModule, ButtonModule],
    templateUrl: "./app.html",
    styleUrl: "./app.css"
})
export class App {
    protected router = inject(Router);
    protected loginService = inject(LoginService);
    protected readonly title = signal("Cutthroat Visuals");

    protected ngOnInit() {
        if (this.loginService.getUserId() === undefined) {
            this.router.navigateByUrl("/");
        }
    }

    public signOut() {
        this.loginService.logOut();
        this.router.navigateByUrl("/");
    }
}
