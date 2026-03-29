import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { COLOMBIA_GEO_DATA } from 'src/app/utils/constants/colombia-geo-data';
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

  countriesNames: string[] = [COLOMBIA_GEO_DATA.country];
  regionsNames: string[] = [];
  citiesNames: string[] = [];
  areasNames: string[] = [];
  filteredCountries: string[] = [];
  filteredRegions: string[] = [];
  filteredCities: string[] = [];
  filteredAreas: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
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
      area: [''],
      observations: [''],
      dataAgreement: [false, Validators.requiredTrue],
      formConsent: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    this.filteredCountries = this.countriesNames.slice();
    if (!this.route.snapshot.queryParamMap.get("projectId")) {
      Swal.fire({ title: "Proyecto no encontrado", text: "No se ha encontrado el proyecto al que intenta acceder", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false });
    }
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

  countrySelectionChange(name: string) {
    this.userForm.get("region")?.setValue("");
    this.userForm.get("city")?.setValue("");
    this.userForm.get("area")?.setValue("");
    this.showArea = false;
    this.userForm.get("area")?.clearValidators();
    this.userForm.get("area")?.updateValueAndValidity();

    const dept = COLOMBIA_GEO_DATA.departments.map(d => d.name);
    this.regionsNames = [...dept, 'N/A'];
    this.filteredRegions = this.regionsNames.slice();
    this.citiesNames = [];
    this.areasNames = [];
  }

  regionSelectionChange(name: string) {
    this.userForm.get("city")?.setValue("");
    this.userForm.get("area")?.setValue("");
    this.showArea = false;
    this.userForm.get("area")?.clearValidators();
    this.userForm.get("area")?.updateValueAndValidity();

    if (name === "N/A") {
      this.citiesNames = ["N/A"];
      this.filteredCities = this.citiesNames.slice();
      return;
    }

    const dept = COLOMBIA_GEO_DATA.departments.find(d => d.name === name);
    this.citiesNames = dept ? dept.cities : ["N/A"];
    this.filteredCities = this.citiesNames.slice();
    this.areasNames = [];
  }

  citySelectionChange(name: string) {
    this.userForm.get("area")?.setValue("");

    if (name === "Bogotá") {
      this.showArea = true;
      this.userForm.get("area")?.setValidators(Validators.required);
      this.userForm.get("area")?.updateValueAndValidity();
      this.areasNames = COLOMBIA_GEO_DATA.bogotaAreas.slice();
      this.filteredAreas = this.areasNames.slice();
    } else {
      this.showArea = false;
      this.userForm.get("area")?.clearValidators();
      this.userForm.get("area")?.updateValueAndValidity();
      this.areasNames = [];
    }
  }
}
