import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';
import { HtmlDocumentoService } from 'src/app/services/htmlDocumento.service';

@Component({
  selector: 'app-resultado-doc-html',
  imports: [
    MaterialModule,
    DatePipe
  ],
  templateUrl: './resultado-doc-html.component.html',
  styleUrl: './resultado-doc-html.component.scss',
})
export class ResultadoDocHtmlComponent implements OnInit {
  
  documento: ArchivoDoc | null;
  id: number = 0;

  private htmlDocumentoService = inject(HtmlDocumentoService);

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe((data) => {
      this.id = data["id"];
      //console.log(`id: ${this.id}`);     
    });
  }

  ngOnInit(): void {
    this.htmlDocumentoService.obtener(this.id).subscribe((data) => {
      this.documento = data;
    });
  }


  volver() {
    this.router.navigate(['/inicio/html/listar-doc-html']);
  }

}
