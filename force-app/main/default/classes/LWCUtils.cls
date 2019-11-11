public with sharing class LWCUtils {
    @AuraEnabled
    public static sObject[] runQuery(String query) {
        try {
            return Database.Query(query);
        } catch (Exception e) {
            throw new AuraHandledException(String.valueOf(e));
        }
    }
}