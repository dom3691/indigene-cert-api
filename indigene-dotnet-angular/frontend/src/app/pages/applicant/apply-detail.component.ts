import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';

import { ApiService } from '../../core/api.service';
import { Application } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-apply-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    QRCodeComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './apply-detail.component.html',
  styleUrls: ['./apply-detail.component.css'],
})
export class ApplyDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly app = signal<Application | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly tab = signal<'details' | 'documents'>('details');
  readonly uploadOpen = signal(false);
  readonly payOpen = signal(false);
  readonly busy = signal(false);

  docName = '';
  docType = 'identification';
  docFileName = '';
  docSizeKb = 100;

  private appId = 0;

  readonly docTypes = [
    { value: 'identification', label: 'Identification (NIN/Passport)' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'parent_id', label: "Parent's ID" },
    { value: 'letter_of_origin', label: 'Letter of Origin from Chief' },
    { value: 'other', label: 'Other' },
  ];

  ngOnInit(): void {
    this.appId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.getApplication(this.appId).subscribe({
      next: (app) => {
        this.app.set(app);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Application not found.');
        this.loading.set(false);
      },
    });
  }

  hasDocuments(): boolean {
    return (this.app()?.documents?.length ?? 0) > 0;
  }

  canSubmit(): boolean {
    const a = this.app();
    return !!a && a.status === 'draft' && this.hasDocuments();
  }

  isIssued(): boolean {
    const a = this.app();
    return !!a && a.status === 'issued' && !!a.certificate;
  }

  stepDone(target: 'draft' | 'payment' | 'review' | 'issued'): boolean {
    const s = this.app()?.status ?? '';
    switch (target) {
      case 'draft':
        return s !== 'draft';
      case 'payment':
        return ['paid', 'under_review', 'issued'].includes(s);
      case 'review':
        return s === 'issued';
      case 'issued':
        return s === 'issued';
    }
  }

  uploadDocument(): void {
    if (!this.docName || !this.docFileName) {
      return;
    }
    this.busy.set(true);
    this.api
      .addDocument(this.appId, {
        name: this.docName,
        type: this.docType,
        fileName: this.docFileName,
        sizeKb: Number(this.docSizeKb) || 0,
      })
      .subscribe({
        next: () => {
          this.docName = '';
          this.docFileName = '';
          this.docSizeKb = 100;
          this.uploadOpen.set(false);
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }

  submitApplication(): void {
    this.busy.set(true);
    this.api
      .updateApplication(this.appId, { status: 'awaiting_payment' })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }

  pay(): void {
    const a = this.app();
    this.busy.set(true);
    this.api
      .payApplication(this.appId, {
        payerName: a?.applicantName || 'Applicant',
        method: 'Card',
      })
      .subscribe({
        next: () => {
          this.payOpen.set(false);
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }

  print(): void {
    window.print();
  }
}
