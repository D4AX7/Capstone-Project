import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReadingEntryComponent } from './reading-entry/reading-entry.component';
import { ReadingListComponent } from './reading-list/reading-list.component';

const routes: Routes = [
  { path: '', component: ReadingListComponent },
  { path: 'new', component: ReadingEntryComponent },
  { path: ':id/edit', component: ReadingEntryComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes), ReadingEntryComponent, ReadingListComponent]
})
export class MeterReadingsModule {}
