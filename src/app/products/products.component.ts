import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DidRenderEvent, SwalComponent, SwalPortalTargets } from '@sweetalert2/ngx-sweetalert2';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { EditorAction } from '../models/EditorAction';
import { Product } from '../models/Product';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(DataTableDirective)
  private dtElement!: DataTableDirective;

  @ViewChild('editorSwal')
  private editorSwal!: SwalComponent;

  @ViewChild('detailsSwal')
  private detailsSwal!: SwalComponent;

  state?: EditorAction;
  validated = false;
  selected?: Product;
  dtTrigger: Subject<any> = new Subject<any>();
  dtOptions: DataTables.Settings = {};
  products: Product[] = [];
  readonly form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(),
    price: new FormControl('', [Validators.required, Validators.min(1)]),
    available: new FormControl('', [Validators.required, Validators.min(1)]),
  });

  constructor(
    private productService: ProductService,
    public readonly swalTargets: SwalPortalTargets
  ) {
    // Work around to prevent close
    // https://github.com/sweetalert2/ngx-sweetalert2/issues/121#issuecomment-486368997
    this.canConfirm = this.canConfirm.bind(this);
  }

  ngAfterViewInit(): void {}

  ngOnInit(): void {
    const options: DataTables.Settings | { buttons: any[] } = {
      pagingType: 'full_numbers',
      language: {
        search: '',
        zeroRecords: 'No hay resultados',
        searchPlaceholder: 'Buscar...',
      },
      info: false,
      dom: '<"filter-container" Bf>rt<"paginator-container" p>',
      lengthChange: false,
      pageLength: 6,
      initComplete: () => {
        // HACK: CSS is delayed for some ms, so wait until the table is totally loaded
        // https://stackoverflow.com/a/47270321/9307869
        jQuery('#table').show();
      },
      buttons: [
        {
          text: 'Nuevo Producto',
          className: 'btn btn-primary new-product-btn text-white ',
          action: () => this.open({ type: 'add' }),
        },
      ],
      drawCallback: () => {
        jQuery('.paginator-container .paginate_button').addClass('page-btn');
      },
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

  rerender(): void {
    this.dtElement.dtInstance.then(async (t: DataTables.Api) => {
      this.products = await this.productService.getAll().toPromise();
      t.destroy();
      this.dtTrigger.next();
    });
  }

  get error() {
    if (this.form.controls['name'].invalid) {
      return 'Especifica el nombre del producto';
    }

    if (this.form.controls['price'].invalid) {
      return 'Especifica el precio del producto mayor a cero';
    }

    if (this.form.controls['available'].invalid) {
      return 'Especifica la cantidad disponible mayor a cero';
    }

    return null;
  }

  get isAdding() {
    return this.state?.type === 'add';
  }

  get isEditing() {
    return this.state?.type === 'update';
  }

  get isDeleting() {
    return this.state?.type === 'delete';
  }

  get isDetailing() {
    return this.state?.type === 'details';
  }

  submit() {
    this.form.markAllAsTouched();
    this.validated = true;

    if (this.form.valid) {
      if (this.selected == null) {
        const temp: Partial<Product> = {
          name: this.form.get('name')?.value,
          description: this.form.get('description')?.value,
          price: this.form.get('price')?.value,
          available: this.form.get('available')?.value,
        };

        this.selected = temp as Product;
      } else {
        this.selected.name = this.form.get('name')?.value;
        this.selected.description = this.form.get('description')?.value;
        this.selected.price = this.form.get('price')?.value;
        this.selected.available = this.form.get('available')?.value;
      }

      if (this.isAdding) {
        this.productService.post(this.selected).subscribe((e) => {
          console.log('ADDED', e);
          this.rerender();
        });
      } else {
        this.productService.update(this.selected).subscribe((e) => {
          console.log('UPDATED', e);
          this.rerender();
        });
      }
    }
  }

  onClose() {
    this.form.reset();
    this.selected = undefined;
    this.validated = false;
    this.state = undefined;
  }

  canConfirm() {
    this.form.markAllAsTouched();
    this.validated = true;
    return this.form.valid;
  }

  openEdit = (id?: number) => this.open({ type: 'update', id: id || this.selected?.id!  });

  openDetails = (id: number) => this.open({ type: 'details', id});

  openDelete = (id: number) => this.open({ type: 'delete', id });

  get editorTitle() {
    return this.isAdding? "Nuevo Producto" : "Editar Producto";
  }

  open(action: EditorAction) {
    this.state = action;

    switch (action.type) {
      case 'add':
        this.editorSwal.title = "Nuevo Producto";
        this.editorSwal.fire();
        break;
      case 'update':
        this.selectProduct(this.products.find((e) => e.id === action.id)!);
        this.editorSwal.title = "Editar Producto";
        this.editorSwal.fire();
        break;
      case 'delete':
        this.selectProduct(
          this.products.find((e) => e.id === action.id)!,
          false
        );
        this.detailsSwal.title = "Eliminar Producto";
        this.detailsSwal.confirmButtonText = 'Eliminar';
        this.detailsSwal.confirmButtonColor = 'red';
        // this.detailsSwal.confirm.subscribe(() => this.delete());
        this.detailsSwal.fire();
        break;
      case 'details':
        this.selectProduct(
          this.products.find((e) => e.id === action.id)!,
          false
        );
        this.detailsSwal.title = "Ver Producto";
        // this.detailsSwal.confirm.subscribe(() => this.openEdit());
        this.detailsSwal.fire();
        break;
      default:
        break;
    }
  }

  delete() {
    this.productService.delete(this.selected!.id).subscribe(e => {
      console.log('DELETED', e);
      this.rerender();
    })
  }

  onRender(event: DidRenderEvent) {
    jQuery(event.modalElement).find('button.swal2-confirm').addClass('btn btn-danger');
  }

  private selectProduct(product: Product, setForm: boolean = true) {
    this.selected = product;

    if (setForm) {
      this.form.get('id')?.setValue(product.id);
      this.form.get('name')?.setValue(product.name);
      this.form.get('description')?.setValue(product.description);
      this.form.get('price')?.setValue(product.price);
      this.form.get('available')?.setValue(product.available);
    }
  }
}
