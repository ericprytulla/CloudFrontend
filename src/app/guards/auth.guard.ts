import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, Router} from '@angular/router';
import { Observable } from 'rxjs';
import {SocketService} from "../services/socket.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private _socketService: SocketService, private _router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this._socketService.isConnected()) {
      console.log("Authenticated")
      return true;
    } else {
      this._router.navigate(['/login']);
      console.log("Not authenticated")
      return false;
    }


  }
}
