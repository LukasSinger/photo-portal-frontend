import { computed, Injectable, signal, type WritableSignal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LoginService {
    private userId: WritableSignal<number | undefined> = signal(undefined);
    private userType: WritableSignal<number | undefined> = signal(undefined);
    private userName: WritableSignal<string | undefined> = signal(undefined);
    private passcode: WritableSignal<string | undefined> = signal(undefined);
    public isPhotographer = computed(() => {
        const userType = this.userType();
        return userType && userType > 1;
    });
    public isAdmin = computed(() => {
        const userType = this.userType();
        return userType && userType > 2;
    });

    public logIn(userId: number, userType: number, userName: string, passcode: string) {
        this.userId.set(userId);
        this.userType.set(userType);
        this.userName.set(userName);
        this.passcode.set(passcode);
    }

    public getUserId() {
        return this.userId();
    }

    public getUserType() {
        return this.userType();
    }

    public getUserName() {
        return this.userName();
    }

    public getPasscode() {
        return this.passcode();
    }

    public logOut() {
        this.userId.set(undefined);
        this.userType.set(undefined);
        this.userName.set(undefined);
        this.passcode.set(undefined);
    }
}
