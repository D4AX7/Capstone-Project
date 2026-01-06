import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-consumer-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h1>Consumer Billing Summary</h1>
      <pre>{{ data | json }}</pre>
    </section>
  `
})
export class ConsumerBillingComponent implements OnInit {
  data: any;
  constructor(private route: ActivatedRoute, private reportService: ReportService) {}
  ngOnInit(): void {
    const consumerId = this.route.snapshot.paramMap.get('consumerId') || '';
    if (consumerId) {
      this.reportService.getConsumerBilling(Number(consumerId)).subscribe((res) => (this.data = res.data));
    }
  }
}
