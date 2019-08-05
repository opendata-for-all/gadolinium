import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Subject, throwError} from 'rxjs';
import {ServerConfig} from '../../../serverConfig';
import {Socket} from 'ngx-socket-io';


@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private isValidFileSub = new Subject<boolean>();

  $isValidFile = this.isValidFileSub.asObservable();

  constructor(private http: HttpClient) {

  }

  static buildFormDataWithFile(file: File) {
    let formData = new FormData();
    formData.append('file', file, file.name);
    return formData;
  }

  async getValidationOfOpenAPIJsonFile(file: File) {
    let data = FileUploadService.buildFormDataWithFile(file);
    let response = await this.http.post(ServerConfig.url + '/OpenAPIJsonValidation', data).toPromise(); //CHANGE WHEN IT IS PROD
    if (response instanceof HttpErrorResponse) {
      this.handleError(response);
    } else if (isValidObject(response)) {
      // @ts-ignore
      return response.isValid;
    }
  }

  public async sendFile(file: File, path: string) {
    let data = FileUploadService.buildFormDataWithFile(file);
    let response = await this.http.post(ServerConfig.url + path, data).toPromise(); //CHANGE WHEN IT IS PROD
    if (response instanceof HttpErrorResponse) {
      this.handleError(response);
    } else {
      return response;
    }
  }

  setValidFileValue(param: boolean) {
    this.isValidFileSub.next(param);
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  };
}

class IsValid {
  isValid: boolean;
}

export function isValidObject(obj: object) {
  return Object.getOwnPropertyNames(new IsValid()).every((property) => property in obj);
}
