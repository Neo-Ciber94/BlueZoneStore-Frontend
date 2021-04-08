import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { Product } from '../models/Product';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit, OnDestroy {
  dtTrigger: Subject<any> = new Subject<any>();
  dtOptions: DataTables.Settings = {};
  products: Product[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    const options: DataTables.Settings | { buttons: any[] } = {
      pagingType: 'full_numbers',
      language: {
        search: '',
        zeroRecords: "No hay resultados",
        searchPlaceholder: "Buscar..."
      },
      info: false,
      dom:
        '<"filter-container" Bf>rt<"paginator-container" p>',
      lengthChange: false,
      pageLength: 6,
      buttons: [
        {
          text: 'Nuevo Producto',
          className: 'btn btn-primary new-product-btn text-white ',
          action: () => {
            alert('CLICK!')
          }
        }
      ],
      drawCallback: (s) => {
        jQuery(".paginator-container .paginate_button").addClass("page-btn")
      }
    };

    this.dtOptions = options as any;
    this.productService.getAll().subscribe((data) => {
      this.products = data;
      this.dtTrigger.next();
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
}
