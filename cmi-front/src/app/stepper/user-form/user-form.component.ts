import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'user-form-component',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  @ViewChild('countryInput') countryInput: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('regionInput') regionInput: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('cityInput') cityInput: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('areaInput') areaInput: ElementRef<HTMLInputElement> | undefined;
  @Input() introductionText: string = "";
  userForm: FormGroup;
  formAttempt: boolean = false;
  showArea: boolean = false;

  allCountries: any[] = [];
  allDepartments: any[] = [];
  allCities: any[] = [];
  allAreas: any[] = [];
  filteredCountries: any[] = [];
  filteredDepartments: any[] = [];
  filteredCities: any[] = [];
  filteredAreas: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private httpClient: HttpClient,
    private route: ActivatedRoute
  ) {
    this.userForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(1), Validators.max(99)]],
      gender: ['', Validators.required],
      socialLevel: ['', [Validators.required]],
      educationalLevel: ['', Validators.required],
      countryId: ['', Validators.required],
      departmentId: ['', Validators.required],
      cityId: ['', Validators.required],
      areaId: [''],
      observations: [''],
      dataAgreement: [false, Validators.requiredTrue],
      formConsent: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    Swal.fire({ title: "Cargando...", allowOutsideClick: false });
    Swal.showLoading();
    this.httpClient.get(`${environment.baseURL}get/countries`).subscribe({
      next: (response: any) => {
        this.allCountries = response;
        this.filteredCountries = response.slice();
        Swal.close();
        if (!this.route.snapshot.queryParamMap.get("projectId")) {
          Swal.fire({ title: "Proyecto no encontrado", text: "No se ha encontrado el proyecto al que intenta acceder", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false });
        }
      },
      error: () => {
        Swal.fire({ title: "Error interno de servidor", text: "Por favor contacte con el administrador", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false });
      }
    });
  }

  displayName = (item: any): string => item?.name || '';

  filterCountries(): void {
    if (this.countryInput?.nativeElement) {
      const val = this.countryInput.nativeElement.value.toLowerCase();
      this.filteredCountries = this.allCountries.filter(o => o.name.toLowerCase().includes(val));
    }
  }

  filterDepartments(): void {
    if (this.regionInput?.nativeElement) {
      const val = this.regionInput.nativeElement.value.toLowerCase();
      this.filteredDepartments = this.allDepartments.filter(o => o.name.toLowerCase().includes(val));
    }
  }

  filterCities(): void {
    if (this.cityInput?.nativeElement) {
      const val = this.cityInput.nativeElement.value.toLowerCase();
      this.filteredCities = this.allCities.filter(o => o.name.toLowerCase().includes(val));
    }
  }

  filterAreas(): void {
    if (this.areaInput?.nativeElement) {
      const val = this.areaInput.nativeElement.value.toLowerCase();
      this.filteredAreas = this.allAreas.filter(o => o.name.toLowerCase().includes(val));
    }
  }

  countrySelectionChange(item: any) {
    this.userForm.get("departmentId")?.setValue('');
    this.userForm.get("cityId")?.setValue('');
    this.userForm.get("areaId")?.setValue('');
    this.allDepartments = [];
    this.allCities = [];
    this.allAreas = [];
    this.showArea = false;
    this.userForm.get("areaId")?.clearValidators();
    this.userForm.get("areaId")?.updateValueAndValidity();

    Swal.fire({ title: "Cargando...", allowOutsideClick: false });
    Swal.showLoading();
    this.httpClient.get(`${environment.baseURL}get/departments?countryId=${item._id}`).subscribe({
      next: (response: any) => {
        this.allDepartments = response;
        this.filteredDepartments = response.slice();
        Swal.close();
      }
    });
  }

  regionSelectionChange(item: any) {
    this.userForm.get("cityId")?.setValue('');
    this.userForm.get("areaId")?.setValue('');
    this.allCities = [];
    this.allAreas = [];
    this.showArea = false;
    this.userForm.get("areaId")?.clearValidators();
    this.userForm.get("areaId")?.updateValueAndValidity();

    Swal.fire({ title: "Cargando...", allowOutsideClick: false });
    Swal.showLoading();
    this.httpClient.get(`${environment.baseURL}get/cities?departmentId=${item._id}`).subscribe({
      next: (response: any) => {
        this.allCities = response;
        this.filteredCities = response.slice();
        Swal.close();
      }
    });
  }

  citySelectionChange(item: any) {
    this.userForm.get("areaId")?.setValue('');
    this.allAreas = [];

    if (item.name === 'Bogotá') {
      Swal.fire({ title: "Cargando...", allowOutsideClick: false });
      Swal.showLoading();
      this.httpClient.get(`${environment.baseURL}get/areas?cityId=${item._id}`).subscribe({
        next: (response: any) => {
          this.allAreas = response;
          this.filteredAreas = response.slice();
          this.showArea = true;
          this.userForm.get("areaId")?.setValidators(Validators.required);
          this.userForm.get("areaId")?.updateValueAndValidity();
          Swal.close();
        }
      });
    } else {
      this.showArea = false;
      this.userForm.get("areaId")?.clearValidators();
      this.userForm.get("areaId")?.updateValueAndValidity();
    }
  }
}
