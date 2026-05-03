import { RoomService } from './room.service';

export class ViewService {
    private roomService: RoomService;

    constructor() {
        this.roomService = new RoomService();
    }
    async getRoomsPageData(userId: number) {
        // Get all data
        const userRooms = await this.roomService.getRoomsByUser(userId);
        const allRooms = await this.roomService.getAllRooms();
        
        // Calculate available rooms (logic goes in service!)
        const userRoomIds = userRooms.map(r => r.id);
        const availableRooms = allRooms.filter(r => !userRoomIds.includes(r.id));
        
        // Return structured data
        return {
            userRooms,
            availableRooms
        };
    }
}