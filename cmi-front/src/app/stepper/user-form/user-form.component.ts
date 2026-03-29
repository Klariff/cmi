import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  countries: any[] = [];
  countriesNames: any[] = [];
  regions: any[] = [];
  regionsNames: any[] = [];
  cities: any[] = [];
  citiesNames: any[] = [];
  areas: any[] = [];
  areasNames: any[] = [];
  filteredCountries: any[] = [];
  filteredRegions: any[] = [];
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
      country: ['', Validators.required],
      region: ['', Validators.required],
      city: ['', Validators.required],
      area: ['', Validators.required],
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
        this.countries = response
        this.countriesNames = response.map((country: any) => country.countryName);
        this.filteredCountries = this.countriesNames.slice();
        Swal.close();
        if (!this.route.snapshot.queryParamMap.get("projectId")) {
          Swal.fire({ title: "Proyecto no encontrado", text: "No se ha encontrado el proyecto al que intenta acceder", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false })
        }
      },
      error: (error: any) => {
        Swal.fire({ title: "Error interno de servidor", text: "Por favor contacte con el administrador", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false })
      }
    })
  }

  filterCountries(): void {
    if (this.countryInput && this.countryInput.nativeElement) {
      const filterValue = this.countryInput.nativeElement.value.toLowerCase();
      this.filteredCountries = this.countriesNames.filter(o => o.toLowerCase().includes(filterValue));
    }
  }

  filterRegions(): void {
    if (this.regionInput && this.regionInput.nativeElement) {
      const filterValue = this.regionInput.nativeElement.value.toLowerCase();
      this.filteredRegions = this.regionsNames.filter(o => o.toLowerCase().includes(filterValue));
    }
  }

  filterCities(): void {
    if (this.cityInput && this.cityInput.nativeElement) {
      const filterValue = this.cityInput.nativeElement.value.toLowerCase();
      this.filteredCities = this.citiesNames.filter(o => o.toLowerCase().includes(filterValue));
    }
  }

  filterAreas(): void {
    if (this.areaInput && this.areaInput.nativeElement) {
      const filterValue = this.areaInput.nativeElement.value.toLowerCase();
      this.filteredAreas = this.areasNames.filter(o => o.toLowerCase().includes(filterValue));
    }
  }

  countrySelectionChange(name: any) {
    Swal.fire({ title: "Cargando...", allowOutsideClick: false });
    Swal.showLoading();
    this.userForm.get("region")?.setValue("");
    this.userForm.get("city")?.setValue("");
    this.userForm.get("area")?.setValue("");
    this.regions = [];
    this.cities = [];
    this.areas = [];
    let country = this.countries.find(country => country.countryName == name)
    this.httpClient.get(`${environment.baseURL}get/hierarchy?geonameId=${country.geonameId}`).subscribe({
      next: (response: any) => {
        this.regions = response
        this.regionsNames = response.map((region: any) => region.name);
        this.regionsNames = this.regionsNames.map((region: any) => region.replace("Departamento de ", "").replace("Department of ", "").replace("Departamento del ", "").replace(" Department", ""))
        this.regionsNames = this.regionsNames.sort()
        this.regionsNames = [...this.regionsNames, "N/A"]
        this.filteredRegions = this.regionsNames.slice();
        Swal.close();
      }
    })
  }

  regionSelectionChange(name: any) {
    Swal.fire({ title: "Cargando...", allowOutsideClick: false });
    Swal.showLoading();
    this.userForm.get("city")?.setValue("");
    this.userForm.get("area")?.setValue("");
    this.cities = [];
    this.areas = [];
    if (name === "N/A") {
      this.citiesNames = ["N/A"];
      this.filteredCities = this.citiesNames.slice();
      Swal.close();
      return;
    } else {
      let region = this.regions.find(region => region.name.replace("Departamento de ", "").replace("Department of ", "").replace("Departamento del ", "").replace(" Department", "") == name)
      this.httpClient.get(`${environment.baseURL}get/hierarchy?geonameId=${region.geonameId}`).subscribe({
        next: (response: any) => {
          this.cities = response
          this.citiesNames = response.map((city: any) => city.name);
          this.citiesNames = [...this.citiesNames, "N/A"]
          this.filteredCities = this.citiesNames.slice();
          Swal.close();
        }
      })
    }
  }

  citySelectionChange(name: any) {
    Swal.fire({ title: "Cargando...", allowOutsideClick: false });
    Swal.showLoading();
    this.userForm.get("area")?.setValue("");
    this.areas = [];
    if (name === "N/A") {
      this.areasNames = ["N/A"];
      this.filteredAreas = this.areasNames.slice();
      Swal.close();
      return;
    }
    let city = this.cities.find(city => city.name == name)
    this.httpClient.get(`${environment.baseURL}get/hierarchy?geonameId=${city.geonameId}`).subscribe({
      next: (response: any) => {
        this.areas = response
        this.areasNames = response.map((area: any) => area.name);
        this.areasNames = this.areasNames.filter(area => area !== "Bogotá");
        this.areasNames = [...this.areasNames, "N/A"];
        this.filteredAreas = this.areasNames.slice();
        Swal.close();
      }
    })
  }
}
