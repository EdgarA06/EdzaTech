import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EdZaPage } from "../../app/edza-page";

@Component({
  selector: "app-root",
  standalone: true,
  template: "<div #reactHost></div>",
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild("reactHost", { static: true }) private reactHost!: ElementRef<HTMLDivElement>;

  private reactRoot?: Root;

  ngAfterViewInit(): void {
    this.reactRoot = createRoot(this.reactHost.nativeElement);
    this.reactRoot.render(createElement(EdZaPage));
  }

  ngOnDestroy(): void {
    this.reactRoot?.unmount();
  }
}
