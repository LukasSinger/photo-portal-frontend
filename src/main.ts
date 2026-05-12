import { bootstrapApplication } from "@angular/platform-browser";
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { App } from "./app/app";

import { providePrimeNG } from "primeng/config";
import { definePreset } from "@primeuix/themes";
import Lara from "@primeuix/themes/lara";

import { provideRouter } from "@angular/router";
import { Routes } from "@angular/router";
import { Login } from "./login/login";
import { Collections } from "./collections/collections";
import { Collection } from "./collection/collection";
import { Users } from "./users/users";

export const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        redirectTo: "login"
    },
    {
        path: "login",
        component: Login
    },
    {
        path: "collections",
        component: Collections
    },
    {
        path: "collection/:id",
        component: Collection
    },
    {
        path: "users",
        component: Users
    }
];

const appTheme = definePreset(Lara, {
    semantic: {
        colorScheme: {
            dark: {
                primary: {
                    color: "#1b3022",
                    hover: {
                        color: "#d73c28"
                    },
                    active: {
                        color: "#b43626"
                    },
                    contrast: {
                        color: "#fff"
                    }
                },
                formField: {
                    hoverBorderColor: "{primary.hover.color}",
                    focusBorderColor: "{primary.hover.color}"
                },
                focusRing: {
                    shadow: "0 0 0 0.2rem color-mix(in srgb, {primary.hover.color}, transparent 80%)"
                }
            }
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        providePrimeNG({
            theme: {
                preset: appTheme,
                options: {
                    darkModeSelector: ".app"
                }
            }
        })
    ]
};

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
