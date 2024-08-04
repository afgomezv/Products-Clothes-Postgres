import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ){}

  async create(createProductDto: CreateProductDto) {

    try {

      const product = this.productsRepository.create(createProductDto);
      await this.productsRepository.save(product);

      return product
      
    } catch (error) {
      //console.log(error);
      this.handleDBExection(error)
    }
  }

  findAll() {
    return this.productsRepository.find({});
  }

  async findOne(id: string) {

    const product = await this.productsRepository.findOneBy({id})

    if(!product)
      throw new NotFoundException(`Product with ${id} not found`)


    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    const product = await this.findOne(id)
    await this.productsRepository.remove(product)
  }

  private handleDBExection(error: any) {
    if(error.code === '23505') 
      throw new BadRequestException(error.detail)
    
    this.logger.error(error)
    throw new InternalServerErrorException('Unexpected error, check server logs')
  }
}
