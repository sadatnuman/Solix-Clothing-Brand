import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  AddressDto,
  CollectionDto,
  ContentDto,
  CouponDto,
  CouponValidateDto,
  ReturnRequestDto,
  ReturnStatusDto,
  ReviewDto,
  ReviewModerationDto,
  SettingsDto,
  StaffDto,
  StaffUpdateDto,
  StockAdjustmentDto,
  SupportTicketDto,
  TicketReplyDto,
  TicketStatusDto,
} from './dto/commerce.dto';

const adminRoles = [UserRole.ADMIN, UserRole.STAFF];

@Controller()
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Get('collections') listCollections() {
    return this.commerce.listCollections();
  }
  @Post('admin/collections')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('catalog')
  createCollection(@GetUser() user: User, @Body() dto: CollectionDto) {
    return this.commerce.saveCollection(user.id, dto);
  }
  @Patch('admin/collections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('catalog')
  updateCollection(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: CollectionDto,
  ) {
    return this.commerce.saveCollection(user.id, dto, id);
  }

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  addresses(@GetUser() user: User) {
    return this.commerce.listAddresses(user.id);
  }
  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  createAddress(@GetUser() user: User, @Body() dto: AddressDto) {
    return this.commerce.createAddress(user.id, dto);
  }
  @Patch('addresses/:id')
  @UseGuards(JwtAuthGuard)
  updateAddress(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: AddressDto,
  ) {
    return this.commerce.updateAddress(user.id, id, dto);
  }
  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  removeAddress(@GetUser() user: User, @Param('id', ObjectIdPipe) id: string) {
    return this.commerce.deleteAddress(user.id, id);
  }

  @Get('wishlist')
  @UseGuards(JwtAuthGuard)
  wishlist(@GetUser() user: User) {
    return this.commerce.wishlist(user.id);
  }
  @Post('wishlist/:productId')
  @UseGuards(JwtAuthGuard)
  addWishlist(
    @GetUser() user: User,
    @Param('productId', ObjectIdPipe) productId: string,
  ) {
    return this.commerce.addWishlist(user.id, productId);
  }
  @Delete('wishlist/:productId')
  @UseGuards(JwtAuthGuard)
  removeWishlist(
    @GetUser() user: User,
    @Param('productId', ObjectIdPipe) productId: string,
  ) {
    return this.commerce.removeWishlist(user.id, productId);
  }

  @Post('coupons/validate')
  @UseGuards(JwtAuthGuard)
  validateCoupon(@GetUser() user: User, @Body() dto: CouponValidateDto) {
    return this.commerce.validateCoupon(user.id, dto.code, dto.subtotal);
  }
  @Get('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('catalog')
  coupons() {
    return this.commerce.listCoupons();
  }
  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('catalog')
  createCoupon(@GetUser() user: User, @Body() dto: CouponDto) {
    return this.commerce.saveCoupon(user.id, dto);
  }
  @Patch('admin/coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('catalog')
  updateCoupon(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: CouponDto,
  ) {
    return this.commerce.saveCoupon(user.id, dto, id);
  }

  @Get('reviews/product/:productId')
  productReviews(@Param('productId', ObjectIdPipe) productId: string) {
    return this.commerce.productReviews(productId);
  }
  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  createReview(@GetUser() user: User, @Body() dto: ReviewDto) {
    return this.commerce.createReview(user.id, dto);
  }
  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('support')
  adminReviews() {
    return this.commerce.adminReviews();
  }
  @Patch('admin/reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('support')
  moderateReview(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: ReviewModerationDto,
  ) {
    return this.commerce.moderateReview(user.id, id, dto.status);
  }

  @Post('returns')
  @UseGuards(JwtAuthGuard)
  createReturn(@GetUser() user: User, @Body() dto: ReturnRequestDto) {
    return this.commerce.createReturn(user.id, dto);
  }
  @Get('returns/mine')
  @UseGuards(JwtAuthGuard)
  myReturns(@GetUser() user: User) {
    return this.commerce.myReturns(user.id);
  }
  @Get('admin/returns')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('fulfilment')
  adminReturns() {
    return this.commerce.adminReturns();
  }
  @Patch('admin/returns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('fulfilment')
  updateReturn(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: ReturnStatusDto,
  ) {
    return this.commerce.updateReturn(user.id, id, dto);
  }

  @Post('support-tickets')
  contact(@Body() dto: SupportTicketDto) {
    return this.commerce.createTicket(dto);
  }
  @Post('support-tickets/mine')
  @UseGuards(JwtAuthGuard)
  createMyTicket(@GetUser() user: User, @Body() dto: SupportTicketDto) {
    return this.commerce.createTicket(dto, user.id);
  }
  @Get('support-tickets/mine')
  @UseGuards(JwtAuthGuard)
  myTickets(@GetUser() user: User) {
    return this.commerce.myTickets(user.id);
  }
  @Post('support-tickets/:id/replies')
  @UseGuards(JwtAuthGuard)
  replyTicket(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: TicketReplyDto,
  ) {
    return this.commerce.replyTicket(user, id, dto);
  }
  @Get('admin/support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('support')
  tickets() {
    return this.commerce.listTickets();
  }
  @Patch('admin/support-tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('support')
  updateTicket(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: TicketStatusDto,
  ) {
    return this.commerce.updateTicket(user.id, id, dto.status);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  notifications(@GetUser() user: User) {
    return this.commerce.myNotifications(user.id);
  }
  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  readNotification(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.commerce.readNotification(user.id, id);
  }

  @Get('content/:key') getContent(@Param('key') key: string) {
    return this.commerce.getContent(key);
  }
  @Put('admin/content/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  saveContent(
    @GetUser() user: User,
    @Param('key') key: string,
    @Body() dto: ContentDto,
  ) {
    return this.commerce.saveContent(user.id, key, dto);
  }
  @Get('store/settings') settings() {
    return this.commerce.getSettings();
  }
  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  saveSettings(@GetUser() user: User, @Body() dto: SettingsDto) {
    return this.commerce.saveSettings(user.id, dto);
  }

  @Get('admin/inventory/movements')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('fulfilment')
  inventory() {
    return this.commerce.inventory();
  }
  @Get('admin/inventory/low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('fulfilment')
  lowStock() {
    return this.commerce.lowStock();
  }
  @Post('admin/inventory/:variantId/adjust')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...adminRoles)
  @Permissions('fulfilment')
  adjustStock(
    @GetUser() user: User,
    @Param('variantId', ObjectIdPipe) variantId: string,
    @Body() dto: StockAdjustmentDto,
  ) {
    return this.commerce.adjustStock(user.id, variantId, dto);
  }
  @Get('admin/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  audit() {
    return this.commerce.listAudit();
  }
  @Post('admin/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createStaff(@GetUser() user: User, @Body() dto: StaffDto) {
    return this.commerce.createStaff(user.id, dto);
  }

  @Get('admin/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listStaff() {
    return this.commerce.listStaff();
  }

  @Patch('admin/staff/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStaff(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: StaffUpdateDto,
  ) {
    return this.commerce.updateStaff(user.id, id, dto);
  }
}
