import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-forbidden',
    imports: [RouterModule, MaterialModule, MatButtonModule],
    templateUrl: './forbidden.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {}
