USE estatelink_db;

DROP TRIGGER IF EXISTS trg_auto_set_property_status_on_deal;

DELIMITER //

CREATE TRIGGER trg_auto_set_property_status_on_deal
AFTER INSERT ON Deals
FOR EACH ROW
BEGIN
    IF NEW.deal_type = 'sale' THEN
        UPDATE Properties
        SET status = 'sold'
        WHERE property_id = NEW.property_id;
    ELSEIF NEW.deal_type = 'rental' THEN
        UPDATE Properties
        SET status = 'ongoing_rental'
        WHERE property_id = NEW.property_id;
    END IF;
END //

DELIMITER ;
